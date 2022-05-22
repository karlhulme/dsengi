/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocumentsDirect,
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
  UnexpectedDocStoreError,
} from "../interfaces/index.ts";

/**
 * The central partition where documents are placed that do not
 * have a dedicated partition.
 */
export const CentralPartition = "_central";

/**
 * Represents the options that can be passed to the cosmosdb store.
 */
export type CosmosDbDocStoreOptions = Record<string, unknown>;

/**
 * Represents a filter that can be processed by cosmosdb.
 */
export interface CosmosDbDocStoreFilter {
  /**
   * The WHERE clause of a cosmos SQL statement, that completes the phrase
   * SELECT d.* FROM docs d WHERE <filter>.  Note that any referenced
   * field names should also be prefixed with "d.".
   */
  whereClause?: string;

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
   * True if the query does not include a filter for a specific partition.
   * If a transform is specified, then the query will be
   * executed cross-partition automatically, and this value has no effect.
   */
  crossPartitionQuery?: boolean;

  /**
   * If the query includes SUM, AVG, COUNT, OFFSET, LIMIT or ORDER BY and
   * does not filter to a specific partition then the gateway cannot process
   * the query and we need to execute the query on each of the containers individually.
   * As a result, we may retrieve more results than the client would like.
   * By providing this function, cosmos will be queried first for the applicable
   * pk-ranges and then queried again for the results from each container
   * and finally this function is used to combine the results.
   */
  transform?: (docs: DocRecord[]) => DocRecord[];
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

  /**
   * A function that gets the partition key value from a document.
   */
  // getPartitionKeyValueFunc: (
  //   databaseName: string,
  //   containerName: string,
  //   docTypeName: string,
  //   docTypePluralName: string,
  //   doc: DocRecord,
  //   options: CosmosDbDocStoreOptions,
  // ) => string | number;
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
  cosmosKey: string
  cryptoKey: CryptoKey|null;
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
  // getPartitionKeyValueFunc: (
  //   databaseName: string,
  //   containerName: string,
  //   docTypeName: string,
  //   docTypePluralName: string,
  //   doc: DocRecord,
  //   options: CosmosDbDocStoreOptions,
  // ) => string | number;

  /**
   * Returns the field name of the partition key for a collection.
   * @param databaseName The name of a database.
   * @param containerName The name of a container.
   */
  // private async getPartitionKeyFieldNameForCollection(
  //   databaseName: string,
  //   containerName: string,
  // ): Promise<string> {
  //   const fqcn = `${databaseName}/${containerName}`;

  //   if (this.collectionsPartitionKeyCache[fqcn]) {
  //     return this.collectionsPartitionKeyCache[fqcn];
  //   }

  //   const collection = await getCollection(
  //     this.cosmosKey,
  //     this.cosmosUrl,
  //     databaseName,
  //     containerName,
  //   );

  //   // istanbul ignore next - all containers have a partition key (legacy ones did not)
  //   const partitionKeyFieldName =
  //     collection.partitionKey.paths[0].substring(1) ||
  //     "missing_partition_key";

  //   this.collectionsPartitionKeyCache[fqcn] = partitionKeyFieldName;
  //   return partitionKeyFieldName;
  // }

  /**
   * Returns a select query based on the given inputs.
   * @param fieldNames An array of field names.
   * @param whereClause A Cosmos WHERE clause.
   */
  private buildSelectCommand(
    fieldNames: string[],
    whereClause?: string,
    orderByFields?: CosmosDbDocStoreFilterOrderByField[],
    limit?: number,
  ): string {
    // additional fields
    const extraFieldNames = Array.isArray(orderByFields)
      ? orderByFields.map((o) => o.fieldName)
      : [];

    // the select and from clauses
    let sql = `
      SELECT ${limit ? `TOP ${limit}` : ""} d._etag ${
      extraFieldNames.concat(fieldNames).map((f) => `, d.${f}`).join("")
    }
      FROM Docs d
    `;

    // the where clause
    if (typeof whereClause === "string") {
      sql += `  WHERE d.pkey = @pkey AND (${whereClause})`;
    } else {
      sql += `  WHERE d.pkey = @pkey`;
    }

    // the order by clause
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
  private async ensureCryptoKey () {
    if (this.cryptoKey === null) {
      this.cryptoKey = await convertCosmosKeyToCryptoKey(this.cosmosKey)
    }
  }

  /**
   * Returns a subset of the given array such that the filter parameters
   * have been honoured.  This additional transform is necessary if the original
   * filter operation was executed by multiple containers.
   * @param docs An array of documents retrieved by a selectByFilter operation.
   * @param filter The filter to be applied.
   */
  // private transformSelectByFilterDocs(
  //   docs: DocRecord[],
  //   filter: CosmosDbDocStoreFilter,
  // ) {
  //   const comparer = function (
  //     docA: DocRecord,
  //     docB: DocRecord,
  //     fieldName: string,
  //     invertValue: boolean,
  //   ) {
  //     const valueA = docA[fieldName];
  //     const valueB = docB[fieldName];
  //     const scaler = invertValue ? -1 : 1;

  //     if (typeof valueA === "number" && typeof valueB === "number") {
  //       return (valueA - valueB) * scaler;
  //     } else {
  //       return (valueA || "").toString().localeCompare(
  //         (valueB || "").toString(),
  //       ) * scaler;
  //     }
  //   };

  //   const orderedDocs = filter.orderByFields
  //     ? docs.sort((docA, docB) => {
  //       let fieldNumber = 0;
  //       let lastCompareResult = 0;
  //       const orderByFieldLength = filter.orderByFields?.length || 0;

  //       while (lastCompareResult === 0 && fieldNumber < orderByFieldLength) {
  //         lastCompareResult = comparer(
  //           docA,
  //           docB,
  //           filter.orderByFields?.[fieldNumber].fieldName as string,
  //           filter.orderByFields?.[fieldNumber].direction === "descending",
  //         );
  //         fieldNumber++;
  //       }

  //       return lastCompareResult;
  //     })
  //     : docs;

  //   return filter.limit ? orderedDocs.slice(0, filter.limit) : orderedDocs;
  // }

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
    // this.getPartitionKeyValueFunc = props.getPartitionKeyValueFunc;
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
    try {
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

      // const partitionKeyFieldName = await this
      //   .getPartitionKeyFieldNameForCollection(
      //     databaseName,
      //     containerName,
      //   );

      // let partitionKeyValue: string | number = "";

      // if (partitionKeyFieldName === "id") {
      //   partitionKeyValue = id;
      // } else {
      //   const docs = await queryDocumentsGateway(
      //     this.cosmosKey,
      //     this.cosmosUrl,
      //     databaseName,
      //     containerName,
      //     `SELECT d.${partitionKeyFieldName} FROM Docs d WHERE d.id = @id`,
      //     [
      //       { name: "@id", value: id },
      //     ],
      //     {
      //       crossPartitionQuery: true,
      //     },
      //   );

      //   if (docs.length === 0) {
      //     return { code: DocStoreDeleteByIdResultCode.NOT_FOUND };
      //   }

      //   const candidatePartitionKeyValue = docs[0][partitionKeyFieldName];

      //   if (
      //     typeof candidatePartitionKeyValue !== "string" &&
      //     typeof candidatePartitionKeyValue !== "number"
      //   ) {
      //     throw new Error(
      //       `Partition key (${partitionKeyFieldName}) for document (${id}) in ${databaseName}/${containerName} was not a string or number.`,
      //     );
      //   }

      //   partitionKeyValue = candidatePartitionKeyValue;
      // }

      await this.ensureCryptoKey()

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
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'deleteById'.",
        err as Error,
      );
    }
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
    try {
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

      // const partitionKeyFieldName = await this
      //   .getPartitionKeyFieldNameForCollection(
      //     databaseName,
      //     containerName,
      //   );

      await this.ensureCryptoKey();

      const docs = await queryDocumentsGateway(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        "SELECT VALUE COUNT(1) FROM Docs d WHERE d.pkey = @pkey AND d.id = @id",
        [
          { name: "@pkey", value: partition },
          { name: "@id", value: id },
        ],
        {},
      );

      // Usually queryDocuments returns an array of documents, but using
      // the VALUE COUNT(1) syntax we get retrieve a scalar value.
      const scalars = docs as unknown as number[];

      return { found: scalars[0] === 1 };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'exists'.",
        err as Error,
      );
    }
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
    try {
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

      // const partitionKeyFieldName = await this
      //   .getPartitionKeyFieldNameForCollection(
      //     databaseName,
      //     containerName,
      //   );

      let rawDoc: DocRecord | null = null;

      // if (partitionKeyFieldName === "id") {
      rawDoc = await getDocument(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        partition,
        id,
      );
      // } else {
      //   const rawDocs = await queryDocumentsGateway(
      //     this.cosmosKey,
      //     this.cosmosUrl,
      //     databaseName,
      //     containerName,
      //     `SELECT * FROM Docs d where d.id = @id`,
      //     [
      //       { name: "@id", value: id },
      //     ],
      //     {
      //       crossPartitionQuery: true,
      //     },
      //   );

      //   if (rawDocs.length === 1) {
      //     rawDoc = rawDocs[0];
      //   }
      // }

      let doc = null;

      if (rawDoc && rawDoc.docType === docTypeName) {
        const { _rid, _ts, _self, _etag, _attachments, ...others } = rawDoc;
        doc = { ...others, docVersion: _etag };
      }

      return { doc };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'fetch'.",
        err as Error,
      );
    }
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
    try {
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

      const docs = query.transform
        ? await queryDocumentsDirect(
          this.cryptoKey as CryptoKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          query.sqlStatement,
          query.sqlParameters,
          {
            transform: query.transform,
          },
        )
        : await queryDocumentsGateway(
          this.cryptoKey as CryptoKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          query.sqlStatement,
          query.sqlParameters,
          {
            crossPartitionQuery: query.crossPartitionQuery,
          },
        );

      return { data: docs };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'query'.",
        err as Error,
      );
    }
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
    try {
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
        queryCmd,
        [
          { name: "@pkey", value: partition },
        ],
        {},
      );

      return { docs: this.buildResultDocs(docs, fieldNames) };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'selectAll'.",
        err as Error,
      );
    }
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
   * @param props Properties that define how to carry out this action.
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
    try {
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
        queryCmd,
        [
          { name: "@pkey", value: partition },
        ],
        {},
      );

      return { docs: this.buildResultDocs(docs, fieldNames) };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'selectByFilter'.",
        err as Error,
      );
    }
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
    try {
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
        queryCmd,
        [
          { name: "@pkey", value: partition },
        ],
        {},
      );

      return { docs: this.buildResultDocs(docs, fieldNames) };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'selectByIds'.",
        err as Error,
      );
    }
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
    try {
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

      // const partitionKeyValue = this.getPartitionKeyValueFunc(
      //   databaseName,
      //   containerName,
      //   docTypeName,
      //   docTypePluralName,
      //   doc,
      //   options,
      // );

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
    } catch (err) {
      // istanbul ignore next - cannot produce the else branch
      if ((err as { code: number }).code === 412) {
        return { code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE };
      } else {
        throw new UnexpectedDocStoreError(
          "Cosmos database error processing 'upsert'.",
          err as Error,
        );
      }
    }
  }
}
