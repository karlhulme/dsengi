// deno-lint-ignore-file require-await
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  DocStatuses,
  DocStore,
  DocStoreDeleteByIdResult,
  DocStoreDeleteByIdResultCode,
  DocStoreExistsResult,
  DocStoreFetchResult,
  DocStoreQueryResult,
  DocStoreRecord,
  DocStoreSelectResult,
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";

/**
 * Represents the parameters that can be passed to the memory document store.
 * The memory document store does not require any parameters at present.
 */
export type MemDocStoreParams = Record<string, unknown>;

/**
 * Represents a filter that can be applied by a memory document store.
 */
export type MemDocStoreFilter = (d: DocStoreRecord) => boolean;

/**
 * Represents a reducer query that can be executed by a memory document store.
 */
export interface MemDocStoreQuery {
  /**
   * A reducer function.
   */
  reducer: (
    previousValue: unknown,
    d: DocStoreRecord,
    index: number,
    array: DocStoreRecord[],
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
  docs: DocStoreRecord[];

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
    MemDocStoreParams,
    MemDocStoreFilter,
    MemDocStoreQuery
  > {
  /**
   * An array of documents.
   */
  docs: DocStoreRecord[];

  /**
   * A function that creates a unique document version number.
   */
  generateDocVersionFunc: () => string;

  /**
   * Deep clone the given array of docs and create a
   * DocStoreSelectResult object.
   * @param docs An array of docs.
   */
  private buildSelectResult(
    docs: DocStoreRecord[],
  ): DocStoreSelectResult {
    return {
      docs: docs.map((doc) => structuredClone(doc)),
      queryCharge: 0,
    };
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
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _docStoreParams The parameters for the document store.
   */
  async deleteById(
    docTypeName: string,
    partition: string,
    id: string,
    _docStoreParams: MemDocStoreParams,
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
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _docStoreParams The parameters for the document store.
   */
  async exists(
    docTypeName: string,
    partition: string,
    id: string,
    _docStoreParams: MemDocStoreParams,
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
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param id The id of a document.
   * @param _docStoreParams The parameters for the document store.
   */
  async fetch(
    docTypeName: string,
    partition: string,
    id: string,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreFetchResult> {
    const doc = this.docs.find((d) =>
      d.docType === docTypeName && d.id === id && d.partitionKey === partition
    );
    return { doc: doc ? JSON.parse(JSON.stringify(doc)) : null };
  }

  /**
   * Executes a query against the document store which potentially
   * operates across multiple partitions.
   * @param docTypeName The type of document.
   * @param query A query to execute.
   * @param _docStoreParams The parameters for the document store.
   */
  async query(
    docTypeName: string,
    query: MemDocStoreQuery,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreQueryResult> {
    const filteredDocs = this.docs.filter((d) => d.docType === docTypeName);

    return {
      data: filteredDocs.reduce(query.reducer, query.initialValue),
      queryCharge: 0,
    };
  }

  /**
   * Selects the documents that contain the digest.
   * @param docTypeName The type of document.
   * @param partition The partition.
   * @param digest A digest to search for.
   * @param _docStoreParams The parameters for the document store.
   */
  async selectByDigest(
    docTypeName: string,
    partition: string,
    digest: string,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs
      .filter((d) =>
        d.docType === docTypeName && d.partitionKey === partition &&
        (d.docDigests as string[]).includes(digest)
      );
    return this.buildSelectResult(matchedDocs);
  }

  /**
   * Selects all documents of a specified type.
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param includeArchived True if the selection should include archived documents.
   * @param _docStoreParams The parameters for the document store.
   */
  async selectAll(
    docTypeName: string,
    partition: string,
    includeArchived: boolean,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition &&
      (includeArchived || d.docStatus === DocStatuses.Active)
    );
    return this.buildSelectResult(matchedDocs);
  }

  /**
   * Select the documents of a specified type that also match a filter.
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param filter A filter.
   * @param includeArchived True if the selection should include archived documents.
   * @param _docStoreParams The parameters for the document store.
   */
  async selectByFilter(
    docTypeName: string,
    partition: string,
    filter: MemDocStoreFilter,
    includeArchived: boolean,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition && filter(d) &&
      (includeArchived || d.docStatus === DocStatuses.Active)
    );
    return this.buildSelectResult(matchedDocs);
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param ids An array of document ids.
   * @param _docStoreParams The parameters for the document store.
   */
  async selectByIds(
    docTypeName: string,
    partition: string,
    ids: string[],
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const matchedDocs = this.docs.filter((d) =>
      d.docType === docTypeName && d.partitionKey === partition &&
      ids.includes(d.id as string)
    );
    return this.buildSelectResult(matchedDocs);
  }

  /**
   * Store a single document in the store, overwriting an existing
   * one if necessary.
   * @param docTypeName The type of document.
   * @param partition The partition where the document is stored.
   * @param doc The document to store.
   * @param _docStoreParams The parameters for the document store.
   */
  async upsert(
    docTypeName: string,
    partition: string,
    doc: DocStoreRecord,
    reqVersion: string | null,
    _docStoreParams: MemDocStoreParams,
  ): Promise<DocStoreUpsertResult> {
    const docCopy = JSON.parse(JSON.stringify(doc));
    docCopy.docVersion = this.generateDocVersionFunc();
    docCopy.partitionKey = partition;

    const index = this.docs.findIndex((d) =>
      d.docType === docTypeName && d.partitionKey === partition &&
      d.id === docCopy.id
    );

    if (
      reqVersion &&
      (index === -1 || this.docs[index].docVersion !== reqVersion)
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
