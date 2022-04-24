/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  createDocument,
  deleteDocument,
  getCollection,
  getDocument,
  queryDocuments,
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
 * Represents the options that can be passed to the cosmosdb store.
 */
export type CosmosDbDocStoreOptions = Record<string, unknown>;

/**
 * Represents a filter that can be processed by cosmosdb.
 */
export interface CosmosDbDocStoreFilter {
  /**
   * The WHERE clause of a cosmos SQL statement, that completes the phrase
   * SELECT d.* FROM docs d WHERE <filter>.
   */
  whereClause: string;
}

/**
 * Represents a query that can be executed against a document collection.
 */
export interface CosmosDbDocStoreQuery {
  /**
   * If populated, executes the given SQL directly against the collection.
   */
  sqlQuery?: string;
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
   * Use the convertCosmosKeyToCryptoKey method to convert the string version
   * to a CryptoKey.
   */
  cosmosKey: CryptoKey;

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
  getPartitionKeyValueFunc: (
    databaseName: string,
    containerName: string,
    docTypeName: string,
    docTypePluralName: string,
    doc: DocRecord,
    options: CosmosDbDocStoreOptions,
  ) => string | number;
}

/**
 * An document store implementation for Microsoft's Azure Cosmos DB.
 */
export class CosmosDbDocStore implements
  DocStore<
    CosmosDbDocStoreOptions,
    CosmosDbDocStoreFilter,
    CosmosDbDocStoreQuery,
    CosmosDbDocStoreQueryResult
  > {
  collectionsPartitionKeyCache: Record<string, string> = {};
  cosmosUrl: string;
  cosmosKey: CryptoKey;
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
  getPartitionKeyValueFunc: (
    databaseName: string,
    containerName: string,
    docTypeName: string,
    docTypePluralName: string,
    doc: DocRecord,
    options: CosmosDbDocStoreOptions,
  ) => string | number;

  /**
   * Returns the field name of the partition key for a collection.
   * @param databaseName The name of a database.
   * @param containerName The name of a container.
   */
  private async getPartitionKeyFieldNameForCollection(
    databaseName: string,
    containerName: string,
  ): Promise<string> {
    const fqcn = `${databaseName}/${containerName}`;

    if (this.collectionsPartitionKeyCache[fqcn]) {
      return this.collectionsPartitionKeyCache[fqcn];
    }

    const collection = await getCollection(
      this.cosmosKey,
      this.cosmosUrl,
      databaseName,
      containerName,
    );

    // istanbul ignore next - all containers have a partition key (legacy ones did not)
    const partitionKeyFieldName =
      collection.partitionKey.paths[0].substring(1) ||
      "missing_partition_key";

    this.collectionsPartitionKeyCache[fqcn] = partitionKeyFieldName;
    return partitionKeyFieldName;
  }

  /**
   * Returns a select query based on the given inputs.
   * @param fieldNames An array of field names.
   * @param whereClause A Cosmos WHERE clause.
   */
  private buildSelectCommand(
    fieldNames: string[],
    whereClause?: string,
  ): string {
    // the select and from clauses, plus the basic where clause
    let sql = `
      SELECT d._etag ${fieldNames.map((f) => `, d.${f}`).join("")}
      FROM Docs d
    `;

    // the detailed where clause
    if (typeof whereClause === "string") {
      sql += `  WHERE (${whereClause})`;
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
   * Constructs a new instance of the document store.
   * @param props The constructor properties.
   */
  constructor(props: CosmosDbDocStoreConstructorProps) {
    this.cosmosUrl = props.cosmosUrl;
    this.cosmosKey = props.cosmosKey;
    this.getDatabaseNameFunc = props.getDatabaseNameFunc;
    this.getContainerNameFunc = props.getContainerNameFunc;
    this.getPartitionKeyValueFunc = props.getPartitionKeyValueFunc;
  }

  /**
   * Delete a single document from the store using it's id.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async deleteById(
    docTypeName: string,
    docTypePluralName: string,
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

      const partitionKeyFieldName = await this
        .getPartitionKeyFieldNameForCollection(
          databaseName,
          containerName,
        );

      let partitionKeyValue: string | number = "";

      if (partitionKeyFieldName === "id") {
        partitionKeyValue = id;
      } else {
        const docs = await queryDocuments(
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          `SELECT d.${partitionKeyFieldName} FROM Docs d WHERE d.id = @id`,
          [
            { name: "@id", value: id },
          ],
          {
            crossPartition: true,
          },
        );

        if (docs.length === 0) {
          return { code: DocStoreDeleteByIdResultCode.NOT_FOUND };
        }

        const candidatePartitionKeyValue = docs[0][partitionKeyFieldName];

        if (
          typeof candidatePartitionKeyValue !== "string" &&
          typeof candidatePartitionKeyValue !== "number"
        ) {
          throw new Error(
            `Partition key (${partitionKeyFieldName}) for document (${id}) in ${databaseName}/${containerName} was not a string or number.`,
          );
        }

        partitionKeyValue = candidatePartitionKeyValue;
      }

      const didDelete = await deleteDocument(
        this.cosmosKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        id,
        partitionKeyValue,
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
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async exists(
    docTypeName: string,
    docTypePluralName: string,
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

      const docs = await queryDocuments(
        this.cosmosKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        "SELECT VALUE COUNT(1) FROM Docs d WHERE d.id = @id",
        [
          { name: "@id", value: id },
        ],
        {
          crossPartition: true,
        },
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
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async fetch(
    docTypeName: string,
    docTypePluralName: string,
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

      const partitionKeyFieldName = await this
        .getPartitionKeyFieldNameForCollection(
          databaseName,
          containerName,
        );

      let rawDoc: DocRecord | null = null;

      if (partitionKeyFieldName === "id") {
        rawDoc = await getDocument(
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          id,
          id,
        );
      } else {
        const rawDocs = await queryDocuments(
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          `SELECT * FROM Docs d where d.id = @id`,
          [
            { name: "@id", value: id },
          ],
          {
            crossPartition: true,
          },
        );

        if (rawDocs.length === 1) {
          rawDoc = rawDocs[0];
        }
      }

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
   * @param query A query to execute.
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
  ): Promise<DocStoreQueryResult<CosmosDbDocStoreQueryResult>> {
    try {
      if (query.sqlQuery) {
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

        const docs = await queryDocuments(
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          query.sqlQuery,
          [],
          {
            crossPartition: true,
          },
        );

        return { data: { docs } };
      } else {
        return { data: {} };
      }
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
   * @param fieldNames An array of field names to include in the response.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectAll(
    docTypeName: string,
    docTypePluralName: string,
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

      const docs = await queryDocuments(
        this.cosmosKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        queryCmd,
        [],
        {
          crossPartition: true,
        },
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
      );

      const docs = await queryDocuments(
        this.cosmosKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        queryCmd,
        [],
        {
          crossPartition: true,
        },
      );

      return { docs: this.buildResultDocs(docs, fieldNames) };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'queryAll'.",
        err as Error,
      );
    }
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param fieldNames An array of field names to include in the response.
   * @param ids An array of document ids.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectByIds(
    docTypeName: string,
    docTypePluralName: string,
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

      const docs = await queryDocuments(
        this.cosmosKey,
        this.cosmosUrl,
        databaseName,
        containerName,
        queryCmd,
        [],
        {
          crossPartition: true,
        },
      );

      return { docs: this.buildResultDocs(docs, fieldNames) };
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError(
        "Cosmos database error processing 'queryAll'.",
        err as Error,
      );
    }
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param doc The document to store.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async upsert(
    docTypeName: string,
    docTypePluralName: string,
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

      const partitionKeyValue = this.getPartitionKeyValueFunc(
        databaseName,
        containerName,
        docTypeName,
        docTypePluralName,
        doc,
        options,
      );

      if (props.reqVersion) {
        const didReplace = await replaceDocument(
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          cleanDoc,
          partitionKeyValue,
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
          this.cosmosKey,
          this.cosmosUrl,
          databaseName,
          containerName,
          cleanDoc,
          partitionKeyValue,
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
