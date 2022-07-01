import { DocStoreRecord } from "./DocStoreRecord.ts";
import { DocStoreDeleteByIdResult } from "./DocStoreDeleteByIdResult.ts";
import { DocStoreExistsResult } from "./DocStoreExistsResult.ts";
import { DocStoreFetchResult } from "./DocStoreFetchResult.ts";
import { DocStoreQueryResult } from "./DocStoreQueryResult.ts";
import { DocStoreSelectResult } from "./DocStoreSelectResult.ts";
import { DocStoreUpsertResult } from "./DocStoreUpsertResult.ts";

/**
 * Defines the functions that must be implemented by a document store.
 */
export interface DocStore<DocStoreParams, Filter, Query> {
  /**
   * Delete a document using a document id.
   */
  deleteById: (
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreDeleteByIdResult>;

  /**
   * Determine if a document exists using a document id.
   */
  exists: (
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreExistsResult>;

  /**
   * Fetch a document using a document id.
   */
  fetch: (
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreFetchResult>;

  /**
   * Execute a query against a document collection.
   */
  query: (
    docTypeName: string,
    query: Query,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreQueryResult>;

  /**
   * Select all the documents of one document type from a collection.
   */
  selectAll: (
    docTypeName: string,
    partition: string,
    fieldNames: string[],
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Select the documents of one document type from a collection that
   * satisfy a given filter.
   */
  selectByFilter: (
    docTypeName: string,
    partition: string,
    fieldNames: string[],
    filter: Filter,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Select the documents of one document type from a collection using a set of document ids.
   */
  selectByIds: (
    docTypeName: string,
    partition: string,
    fieldNames: string[],
    ids: string[],
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Update or insert a document into a collection.
   */
  upsert: (
    docTypeName: string,
    partition: string,
    doc: DocStoreRecord,
    reqVersion: string | null,
    docStoreParams: DocStoreParams,
  ) => Promise<DocStoreUpsertResult>;
}
