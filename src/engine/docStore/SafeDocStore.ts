import {
  DocStore,
  DocStoreDeleteByIdResult,
  DocStoreExistsResult,
  DocStoreFetchResult,
  DocStoreQueryResult,
  DocStoreRecord,
  DocStoreSelectResult,
  DocStoreUpsertResult,
  MissingDocStoreFunctionError,
  UnexpectedDocStoreError,
} from "../../interfaces/index.ts";

/**
 * A document store that wraps any errors so the source can be identified.
 */
export class SafeDocStore<DocStoreParams, Filter, Query>
  implements DocStore<DocStoreParams, Filter, Query> {
  /**
   * Constructs a new instance of the safe doc store.
   * This function raises an error if a required function is not
   * defined on the given document store.
   * @param docStore A doc store implementation.
   */
  constructor(
    readonly docStore: DocStore<DocStoreParams, Filter, Query>,
  ) {
    const functionNames = [
      "deleteById",
      "exists",
      "fetch",
      "query",
      "selectAll",
      "selectByDigest",
      "selectByFilter",
      "selectByIds",
      "upsert",
    ];

    const record = docStore as unknown as Record<string, unknown>;

    functionNames.forEach((functionName) => {
      if (typeof record[functionName] !== "function") {
        throw new MissingDocStoreFunctionError(functionName);
      }
    });
  }

  /**
   * Delete a single document from the store using it's id.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param id The id of a document.
   * @param docStoreParams The params for the document store.
   */
  async deleteById(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreDeleteByIdResult> {
    try {
      const result = await this.docStore.deleteById(
        docTypeName,
        partition,
        id,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("deleteById", err as Error);
    }
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param id The id of a document.
   * @param docStoreParams The params for the document store.
   */
  async exists(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreExistsResult> {
    try {
      const result = await this.docStore.exists(
        docTypeName,
        partition,
        id,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("exists", err as Error);
    }
  }

  /**
   * Fetch a single document using it's id.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param id The id of a document.
   * @param docStoreParams The params for the document store.
   */
  async fetch(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreFetchResult> {
    try {
      const result = await this.docStore.fetch(
        docTypeName,
        partition,
        id,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("fetch", err as Error);
    }
  }

  /**
   * Execute a query against the doc store.
   * @param docTypeName The name of a doc type.
   * @param query The query to be executed.
   * @param docStoreParams The params for the document store.
   */
  async query(
    docTypeName: string,
    query: Query,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreQueryResult> {
    try {
      const result = await this.docStore.query(
        docTypeName,
        query,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("query", err as Error);
    }
  }

  /**
   * Select all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param includeArchived True if the selection should include archived documents.
   * @param docStoreParams The params for the document store.
   */
  async selectAll(
    docTypeName: string,
    partition: string,
    includeArchived: boolean,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectAll(
        docTypeName,
        partition,
        includeArchived,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectAll", err as Error);
    }
  }

  /**
   * Select documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param filter A filter.
   * @param includeArchived True if the selection should include archived documents.
   * @param docStoreParams The params for the document store.
   */
  async selectByFilter(
    docTypeName: string,
    partition: string,
    filter: Filter,
    includeArchived: boolean,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectByFilter(
        docTypeName,
        partition,
        filter,
        includeArchived,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectByFilter", err as Error);
    }
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param ids An array of document ids.
   * @param docStoreParams The params for the document store.
   */
  async selectByIds(
    docTypeName: string,
    partition: string,
    ids: string[],
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectByIds(
        docTypeName,
        partition,
        ids,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectByIds", err as Error);
    }
  }

  /**
   * Select documents of a specified type that contain the given digest.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param digest A digest.
   * @param docStoreParams The params for the document store.
   */
  async selectByDigest(
    docTypeName: string,
    partition: string,
    digest: string,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectByDigest(
        docTypeName,
        partition,
        digest,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectByDigest", err as Error);
    }
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a document partition.
   * @param doc The document to store.
   * @param reqVersion If populated, the target document must have the stated version,
   * otherwise the document will not be updated.
   * @param docStoreParams The params for the document store.
   */
  async upsert(
    docTypeName: string,
    partition: string,
    doc: DocStoreRecord,
    reqVersion: string | null,
    docStoreParams: DocStoreParams,
  ): Promise<DocStoreUpsertResult> {
    try {
      const result = await this.docStore.upsert(
        docTypeName,
        partition,
        doc,
        reqVersion,
        docStoreParams,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("upsert", err as Error);
    }
  }
}
