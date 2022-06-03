/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocumentsContainersDirect,
  queryDocumentsGateway,
  replaceDocument,
} from "../cosmosClient/index.ts";
import {
  DocRecord,
  DocStore,
  DocStoreDeleteByIdProps,
  DocStoreDeleteByIdResult,
  DocStoreDeleteByIdResultCode,
  DocStoreExistsProps,
  DocStoreExistsResult,
  DocStoreFetchProps,
  DocStoreFetchResult,
  DocStoreQueryProps,
  DocStoreQueryResult,
  DocStoreSelectProps,
  DocStoreSelectResult,
  DocStoreUpsertProps,
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";

/**
 * The maximum number of documents that can be retrieved in a single select.
 * If more documents are required, then use the selectByFilter functionality
 * to retrieve the data in batches.
 */
const MAX_DOCS_TO_SELECT = 200;

/**
 * Represents the options that can be passed to the cosmosdb store.
 */
export type CosmosDbDocStoreOptions = Record<string, unknown>;

/**
 * Represents a parameter in a Cosmos SQL statement or clause.
 */
export interface CosmosDbDocStoreQueryParameter {
  /**
   * The name of a parameter in the sqlStatement that should
   * be prefixed with an @ symbol.
   */
  name: string;

  /**
   * The value to use where the parameter appears in the sqlStatement.
   */
  value: unknown;
}

/**
 * Represents a filter that can be processed by cosmosdb.
 */
export interface CosmosDbDocStoreFilter {
  /**
   * The WHERE clause of a cosmos SQL statement, that completes the phrase
   * SELECT d.* FROM docs d WHERE <filter>.  Note that any referenced
   * field names should also be prefixed with "d.".  You can use parameters
   * by prefixing with an @ symbol.
   */
  whereClause?: string;

  /**
   * An array of parameter values that are to be substituted into
   * the where clause.
   */
  parameters?: CosmosDbDocStoreQueryParameter[];

  /**
   * An array of fields to sort by.
   * Cosmos only supports ordering by fields that are included
   * in an index.  To order on multiple fields, there will need
   * to be a corresponding composite index.
   */
  orderByFields?: CosmosDbDocStoreFilterOrderByField[];

  /**
   * The maximum number of documents to return.
   */
  limit?: number;
}

export interface CosmosDbDocStoreFilterOrderByField {
  /**
   * The name of a field.
   */
  fieldName: string;

  /**
   * The order direction.  If not specified, an ascending order is used.
   */
  direction?: "ascending" | "descending";
}

/**
 * Represents a query that can be executed against a document collection
 * which potentially operates across multiple partitions.
 */
export interface CosmosDbDocStoreQuery {
  /**
   * If populated, executes the given SQL directly against the collection.
   */
  sqlStatement: string;

  /**
   * An array of parameters to be substituted into the given sqlStatement.
   */
  sqlParameters: CosmosDbDocStoreQueryParameter[];

  /**
   * Queries are executed across all partitions.  The gateway cannot determine
   * aggregate values () across multiple partitions and will fail.  So instead,
   * all queries are executed against the individual physical containers via
   * the pk-range that each one supports.  This transform function then determines
   * which of the complete result set should be returned to the client.
   */
  transform: (docs: DocRecord[]) => DocRecord[];
}

/**
 * Represents the result of a query executed against a document collection.
 */
export interface CosmosDbDocStoreQueryResult {
  /**
   * If populated, contains the result of an executed sql command.
   */
  docs?: DocRecord[];
}

/**
 * The parameters for constructing a CosmosDbDocStore.
 */
interface CosmosDbDocStoreConstructorProps {
  /**
   * The url of the cosmos instance.
   */
  cosmosUrl: string;

  /**
   * The key that grants read and write access.
   * This string key will be converted to a CryptoKey instance the first
   * time the store needs to communicate with Cosmos.
   */
  cosmosKey: string;

  /**
   * A function that names the database that contains documents identified by the given docTypeName or docTypePluralName.
   */
  getDatabaseNameFunc: (
    docTypeName: string,
    docTypePluralName: string,
    options: CosmosDbDocStoreOptions,
  ) => string;

  /**
   * A function that names the container that contains documents identified by the given docTypeName or docTypePluralName.
   */
  getContainerNameFunc: (
    databaseName: string,
    docTypeName: string,
    docTypePluralName: string,
    options: CosmosDbDocStoreOptions,
  ) => string;
}

/**
 * An document store implementation for Microsoft's Azure Cosmos DB.
 */
export class CosmosDbDocStore implements
  DocStore<
    CosmosDbDocStoreOptions,
    CosmosDbDocStoreFilter,
    CosmosDbDocStoreQuery
  > {
  collectionsPartitionKeyCache: Record<string, string> = {};
  cosmosUrl: string;
  cosmosKey: string;
  cryptoKey: CryptoKey | null;
  getDatabaseNameFunc: (
    docTypeName: string,
    docTypePluralName: string,
    options: CosmosDbDocStoreOptions,
  ) => string;
  getContainerNameFunc: (
    databaseName: string,
    docTypeName: string,
    docTypePluralName: string,
    options: CosmosDbDocStoreOptions,
  ) => string;

  /**
   * Returns a select query based on the given inputs.
   * @param fieldNames An array of field names.
   * @param whereClause A Cosmos WHERE clause.
   * @param orderByFields An array of fields that will appear in the ORDER BY clause.
   * @param limit The maximum number of documents to select.
   */
  private buildSelectCommand(
    fieldNames: string[],
    whereClause?: string,
    orderByFields?: CosmosDbDocStoreFilterOrderByField[],
    limit?: number,
  ): string {
    // Determine the field names by combining orderBy fields
    // with the ones originally requested.  Then use sets
    // to knock out any duplicates and finally use filter
    // to remove any empty strings.  Field names not found
    // on the resource will not produce any output and this
    // is not an error condition.
    const orderByFieldNames = Array.isArray(orderByFields)
      ? orderByFields.map((o) => o.fieldName)
      : [];
    const finalFieldNames = [...new Set(fieldNames.concat(orderByFieldNames))]
      .filter(f => f);

    // Determine the top/limit.
    const top = limit && limit < MAX_DOCS_TO_SELECT
      ? limit
      : MAX_DOCS_TO_SELECT;

    // Determine the select and from clauses.
    let sql = `
      SELECT TOP ${top} d._etag ${
      finalFieldNames.map((f) => `, d.${f}`).join("")
    }
      FROM Docs d
    `;

    // Determine the where clause.
    if (typeof whereClause === "string") {
      sql += `  WHERE d.pkey = @pkey AND (${whereClause})`;
    } else {
      sql += `  WHERE d.pkey = @pkey`;
    }

    // Determine the order by clause.
    if (Array.isArray(orderByFields)) {
      const orderSnippets = orderByFields.map((f) =>
        `d.${f.fieldName} ${f.direction === "descending" ? "DESC" : "ASC"}`
      );
      sql += ` ORDER BY ${orderSnippets.join(", ")}`;
    }

    return sql;
  }

  /**
   * Return a new array of docs whereby each document
   * only contains the fields in the given fieldNames array.
   * @param {Array} docs An array of docs.
   * @param {Array} fieldNames An array of field names.
   */
  private buildResultDocs(docs: DocRecord[], fieldNames: string[]) {
    const results: DocRecord[] = [];

    for (let i = 0; i < docs.length; i++) {
      const result: DocRecord = {};

      for (const fieldName of fieldNames) {
        if (fieldName === "docVersion") {
          result[fieldName] = docs[i]._etag;
        } else {
          result[fieldName] = docs[i][fieldName];
        }
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Creates a new document using the keys of the given doc
   * bypassing any properties named in the given omitKeys array.
   * @param doc A document.
   * @param fieldNamesToOmit An array of property keys.
   */
  private createSubsetOfDocument(doc: DocRecord, fieldNamesToOmit: string[]) {
    return Object.keys(doc).reduce((result: DocRecord, key: string) => {
      if (!fieldNamesToOmit.includes(key)) {
        result[key] = doc[key];
      }

      return result;
    }, {});
  }

  /**
   * Ensures the cosmos key has been converted to a crypto key
   * that can be passed to the Cosmos store.
   */
  private async ensureCryptoKey() {
    if (this.cryptoKey === null) {
      this.cryptoKey = await convertCosmosKeyToCryptoKey(this.cosmosKey);
    }
  }

  /**
   * Constructs a new instance of the document store.
   * @param props The constructor properties.
   */
  constructor(props: CosmosDbDocStoreConstructorProps) {
    this.cosmosUrl = props.cosmosUrl;
    this.cosmosKey = props.cosmosKey;
    this.cryptoKey = null;
    this.getDatabaseNameFunc = props.getDatabaseNameFunc;
    this.getContainerNameFunc = props.getContainerNameFunc;
  }

  /**
   * Delete a single document from the store using it's id.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async deleteById(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: CosmosDbDocStoreOptions,
    _props: DocStoreDeleteByIdProps,
  ): Promise<DocStoreDeleteByIdResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    await this.ensureCryptoKey();

    const didDelete = await deleteDocument(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      id,
    );

    const resultCode = didDelete
      ? DocStoreDeleteByIdResultCode.DELETED
      : DocStoreDeleteByIdResultCode.NOT_FOUND;

    return { code: resultCode };
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async exists(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: CosmosDbDocStoreOptions,
    _props: DocStoreExistsProps,
  ): Promise<DocStoreExistsResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    await this.ensureCryptoKey();

    const docs = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      "SELECT VALUE COUNT(1) FROM Docs d WHERE d.pkey = @pkey AND d.id = @id",
      [
        { name: "@pkey", value: partition },
        { name: "@id", value: id },
      ],
    );

    // Usually queryDocuments returns an array of documents, but using
    // the VALUE COUNT(1) syntax we retrieve a scalar value.
    const scalars = docs as unknown as number[];

    return { found: scalars[0] === 1 };
  }

  /**
   * Fetch a single document using it's id.
   * If the partition key for the collection is the id field then the
   * document will be fetched via id, otherwise a cross-partition
   * query will be used.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async fetch(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: CosmosDbDocStoreOptions,
    _props: DocStoreFetchProps,
  ): Promise<DocStoreFetchResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    await this.ensureCryptoKey();

    let rawDoc: DocRecord | null = null;

    rawDoc = await getDocument(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      id,
    );

    let doc = null;

    if (rawDoc && rawDoc.docType === docTypeName) {
      const { _rid, _ts, _self, _etag, _attachments, ...others } = rawDoc;
      doc = { ...others, docVersion: _etag };
    }

    return { doc };
  }

  /**
   * Execute a query against the document store.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param query A query to execute that should include a clause for =
   * a specific partition.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async query(
    docTypeName: string,
    docTypePluralName: string,
    query: CosmosDbDocStoreQuery,
    options: CosmosDbDocStoreOptions,
    _props: DocStoreQueryProps,
  ): Promise<DocStoreQueryResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    await this.ensureCryptoKey();

    const docs = await queryDocumentsContainersDirect(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      query.sqlStatement,
      query.sqlParameters,
      {
        transform: query.transform,
      },
    );

    return { data: docs };
  }

  /**
   * Select all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param fieldNames An array of field names to include in the response.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectAll(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    options: CosmosDbDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    const queryCmd = this.buildSelectCommand(
      fieldNames,
    );

    await this.ensureCryptoKey();

    const docs = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      queryCmd,
      [
        { name: "@pkey", value: partition },
      ],
    );

    return { docs: this.buildResultDocs(docs, fieldNames) };
  }

  /**
   * Select documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param fieldNames An array of field names to include in the response.
   * @param filter A filter expression that resulted from invoking the filter.
   * implementation on the doc type.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectByFilter(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    filter: CosmosDbDocStoreFilter,
    options: CosmosDbDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    const queryCmd = this.buildSelectCommand(
      fieldNames,
      filter.whereClause,
      filter.orderByFields,
      filter.limit,
    );

    await this.ensureCryptoKey();

    const docs = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      queryCmd,
      [
        { name: "@pkey", value: partition },
        ...(filter.parameters || []),
      ],
    );

    return { docs: this.buildResultDocs(docs, fieldNames) };
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param fieldNames An array of field names to include in the response.
   * @param ids An array of document ids.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectByIds(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    ids: string[],
    options: CosmosDbDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    const whereClause = `d.id IN (${ids.map((i) => `"${i}"`).join(", ")})`;

    const queryCmd = this.buildSelectCommand(
      fieldNames,
      whereClause,
    );

    await this.ensureCryptoKey();

    const docs = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      databaseName,
      containerName,
      partition,
      queryCmd,
      [
        { name: "@pkey", value: partition },
      ],
    );

    return { docs: this.buildResultDocs(docs, fieldNames) };
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param doc The document to store.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async upsert(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    doc: DocRecord,
    options: CosmosDbDocStoreOptions,
    props: DocStoreUpsertProps,
  ): Promise<DocStoreUpsertResult> {
    const cleanDoc = this.createSubsetOfDocument(doc, [
      "docVersion",
      "_attachments",
      "_etag",
      "_ts",
    ]);

    const databaseName = this.getDatabaseNameFunc(
      docTypeName,
      docTypePluralName,
      options,
    );

    const containerName = this.getContainerNameFunc(
      databaseName,
      docTypeName,
      docTypePluralName,
      options,
    );

    await this.ensureCryptoKey();

    if (props.reqVersion) {
      const didReplace = await replaceDocument(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        partition,
        cleanDoc,
        {
          ifMatch: props.reqVersion,
        },
      );

      const resultCode = didReplace
        ? DocStoreUpsertResultCode.REPLACED
        : DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE;

      return { code: resultCode };
    } else {
      const didCreate = await createDocument(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        partition,
        cleanDoc,
        {
          upsertDocument: true,
        },
      );

      const resultCode = didCreate
        ? DocStoreUpsertResultCode.CREATED
        : DocStoreUpsertResultCode.REPLACED;

      return { code: resultCode };
    }
  }
}
