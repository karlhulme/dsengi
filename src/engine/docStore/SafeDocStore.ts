import {
  DocRecord,
  DocStore,
  DocStoreDeleteByIdProps,
  DocStoreDeleteByIdResult,
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
  MissingDocStoreFunctionError,
  UnexpectedDocStoreError,
} from "../../interfaces/index.ts";

/**
 * A Doc Store that wraps any errors so the source can be identified.
 */
export class SafeDocStore<DocStoreOptions, Filter, Query>
  implements DocStore<DocStoreOptions, Filter, Query> {
  /**
   * Constructs a new instance of the safe doc store.
   * This function raises an error if a required function is not
   * defined on the given document store.
   * @param docStore A doc store implementation.
   */
  constructor(
    readonly docStore: DocStore<DocStoreOptions, Filter, Query>,
  ) {
    const functionNames = [
      "deleteById",
      "exists",
      "fetch",
      "query",
      "selectAll",
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
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async deleteById(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: DocStoreOptions,
    props: DocStoreDeleteByIdProps,
  ): Promise<DocStoreDeleteByIdResult> {
    try {
      const result = await this.docStore.deleteById(
        docTypeName,
        docTypePluralName,
        partition,
        id,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("deleteById", err as Error);
    }
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
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
    options: DocStoreOptions,
    props: DocStoreExistsProps,
  ): Promise<DocStoreExistsResult> {
    try {
      const result = await this.docStore.exists(
        docTypeName,
        docTypePluralName,
        partition,
        id,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("exists", err as Error);
    }
  }

  /**
   * Fetch a single document using it's id.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async fetch(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: DocStoreOptions,
    props: DocStoreFetchProps,
  ): Promise<DocStoreFetchResult> {
    try {
      const result = await this.docStore.fetch(
        docTypeName,
        docTypePluralName,
        partition,
        id,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("fetch", err as Error);
    }
  }

  /**
   * Execute a query against the doc store.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param query The query to be executed.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async query(
    docTypeName: string,
    docTypePluralName: string,
    query: Query,
    options: DocStoreOptions,
    props: DocStoreQueryProps,
  ): Promise<DocStoreQueryResult> {
    try {
      const result = await this.docStore.query(
        docTypeName,
        docTypePluralName,
        query,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("query", err as Error);
    }
  }

  /**
   * Select all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
   * @param fieldNames An array of field names to include in the response.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectAll(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectAll(
        docTypeName,
        docTypePluralName,
        partition,
        fieldNames,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectAll", err as Error);
    }
  }

  /**
   * Select documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
   * @param fieldNames An array of field names to include in the response.
   * @param filter A filter.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectByFilter(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    filter: Filter,
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectByFilter(
        docTypeName,
        docTypePluralName,
        partition,
        fieldNames,
        filter,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectByFilter", err as Error);
    }
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
   * @param fieldNames An array of field names to include in the response.
   * @param ids An array of document ids.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectByIds(
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    ids: string[],
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    try {
      const result = await this.docStore.selectByIds(
        docTypeName,
        docTypePluralName,
        partition,
        fieldNames,
        ids,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("selectByIds", err as Error);
    }
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param partition The name of a document partition.
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
    options: DocStoreOptions,
    props: DocStoreUpsertProps,
  ): Promise<DocStoreUpsertResult> {
    try {
      const result = await this.docStore.upsert(
        docTypeName,
        docTypePluralName,
        partition,
        doc,
        options,
        props,
      );
      return result;
    } catch (err) {
      throw new UnexpectedDocStoreError("upsert", err as Error);
    }
  }
}
