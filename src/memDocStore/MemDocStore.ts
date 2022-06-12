// deno-lint-ignore-file require-await
/* eslint-disable @typescript-eslint/no-unused-vars */
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
 * Represents the options that can be passed to the memory document store.
 */
export type MemDocStoreOptions = Record<string, unknown>;

/**
 * Represents a filter that can be applied by a memory document store.
 */
export type MemDocStoreFilter = (d: DocRecord) => boolean;

/**
 * Represents a reducer query that can be executed by a memory document store.
 */
export interface MemDocStoreQuery {
  /**
   * A reducer function.
   */
  reducer: (
    previousValue: unknown,
    d: DocRecord,
    index: number,
    array: DocRecord[],
  ) => unknown;

  /**
   * The initial value.
   */
  initialValue: unknown;
}

/**
 * The parameters for constructing a MemDocStore.
 */
interface MemDocStoreConstructorProps {
  /**
   * An array of documents to use as the initial contents of the document store.
   */
  docs: DocRecord[];

  /**
   * A function that returns a unique string.
   */
  generateDocVersionFunc: () => string;
}

/**
 * An in-memory document store.
 */
export class MemDocStore implements
  DocStore<
    MemDocStoreOptions,
    MemDocStoreFilter,
    MemDocStoreQuery
  > {
  /**
   * An array of documents.
   */
  docs: DocRecord[];

  /**
   * A function that creates a unique document version number.
   */
  generateDocVersionFunc: () => string;

  /**
   * Return a new array of docs whereby each document
   * only contains the fields in the given fieldNames array.
   * @param docs An array of docs.
   * @param fieldNames An array of field names.
   */
  private buildSelectResult(
    docs: DocRecord[],
    fieldNames: string[],
  ): DocStoreSelectResult {
    const results: DocRecord[] = [];

    for (let i = 0; i < docs.length; i++) {
      const result: DocRecord = {};

      for (const fieldName of fieldNames) {
        result[fieldName] = docs[i][fieldName];
      }

      results.push(result);
    }

    return { docs: JSON.parse(JSON.stringify(results)) };
  }

  /**
   * Constructs a new instance of the in-memory document store.
   * @param props The constructor properties.
   */
  constructor(props: MemDocStoreConstructorProps) {
    this.docs = props.docs;
    this.generateDocVersionFunc = props.generateDocVersionFunc;
  }

  /**
   * Delete a single document from the store using it's id.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async deleteById(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    id: string,
    _options: MemDocStoreOptions,
    _props: DocStoreDeleteByIdProps,
  ): Promise<DocStoreDeleteByIdResult> {
    const index = this.docs.findIndex((d) =>
      d.docType === docTypeName && d.id === id && d.partitionKey === partition
    );

    if (index > -1) {
      this.docs.splice(index, 1);
      return { code: DocStoreDeleteByIdResultCode.DELETED };
    } else {
      return { code: DocStoreDeleteByIdResultCode.NOT_FOUND };
    }
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async exists(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    id: string,
    _options: MemDocStoreOptions,
    _props: DocStoreExistsProps,
  ): Promise<DocStoreExistsResult> {
    return {
      found:
        this.docs.findIndex((d) =>
          d.docType === docTypeName && d.id === id &&
          d.partitionKey === partition
        ) >
          -1,
    };
  }

  /**
   * Fetch a single document using it's id.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async fetch(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    id: string,
    _options: MemDocStoreOptions,
    _props: DocStoreFetchProps,
  ): Promise<DocStoreFetchResult> {
    const doc = this.docs.find((d) =>
      d.docType === docTypeName && d.id === id && d.partitionKey === partition
    );
    return { doc: doc ? JSON.parse(JSON.stringify(doc)) : null };
  }

  /**
   * Executes a query against the document store which potentially
   * operates across multiple partitions.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param query A query to execute.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async query(
    docTypeName: string,
    _docTypePluralName: string,
    query: MemDocStoreQuery,
    _options: MemDocStoreOptions,
    _props: DocStoreQueryProps,
  ): Promise<DocStoreQueryResult> {
    const filteredDocs = this.docs.filter((d) => d.docType === docTypeName);

    return {
      data: filteredDocs.reduce(query.reducer, query.initialValue),
    };
  }

  /**
   * Selects all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param fieldNames An array of field names to include in the response.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectAll(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    _options: MemDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition
    );
    return this.buildSelectResult(matchedDocs, fieldNames);
  }

  /**
   * Select the documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param fieldNames An array of field names to include in the response.
   * @param filter A filter.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectByFilter(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    filter: MemDocStoreFilter,
    _options: MemDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition && filter(d)
    );
    return this.buildSelectResult(matchedDocs, fieldNames);
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param fieldNames An array of field names to include in the response.
   * @param ids An array of document ids.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param _props Properties that define how to carry out this action.
   */
  async selectByIds(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    ids: string[],
    _options: MemDocStoreOptions,
    _props: DocStoreSelectProps,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition &&
      ids.includes(d.id as string)
    );
    return this.buildSelectResult(matchedDocs, fieldNames);
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param _docTypePluralName The plural name of a doc type.
   * @param partition The partition where the document is stored.
   * @param doc The document to store.
   * @param _options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async upsert(
    docTypeName: string,
    _docTypePluralName: string,
    partition: string,
    doc: DocRecord,
    _options: MemDocStoreOptions,
    props: DocStoreUpsertProps,
  ): Promise<DocStoreUpsertResult> {
    const docCopy = JSON.parse(JSON.stringify(doc));
    docCopy.docVersion = this.generateDocVersionFunc();
    docCopy.partitionKey = partition;

    const index = this.docs.findIndex((d) =>
      d.docType === docTypeName && d.partitionKey === partition &&
      d.id === docCopy.id
    );

    if (
      props.reqVersion &&
      (index === -1 || this.docs[index].docVersion !== props.reqVersion)
    ) {
      return { code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE };
    } else {
      if (index > -1) {
        this.docs.splice(index, 1, docCopy);
        return { code: DocStoreUpsertResultCode.REPLACED };
      } else {
        this.docs.push(docCopy);
        return { code: DocStoreUpsertResultCode.CREATED };
      }
    }
  }
}
