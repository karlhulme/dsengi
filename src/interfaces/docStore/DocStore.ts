import { DocRecord } from "../doc/index.ts";
import { DocStoreDeleteByIdProps } from "./DocStoreDeleteByIdProps.ts";
import { DocStoreDeleteByIdResult } from "./DocStoreDeleteByIdResult.ts";
import { DocStoreExistsProps } from "./DocStoreExistsProps.ts";
import { DocStoreExistsResult } from "./DocStoreExistsResult.ts";
import { DocStoreFetchProps } from "./DocStoreFetchProps.ts";
import { DocStoreFetchResult } from "./DocStoreFetchResult.ts";
import { DocStoreQueryProps } from "./DocStoreQueryProps.ts";
import { DocStoreQueryResult } from "./DocStoreQueryResult.ts";
import { DocStoreSelectProps } from "./DocStoreSelectProps.ts";
import { DocStoreSelectResult } from "./DocStoreSelectResult.ts";
import { DocStoreUpsertProps } from "./DocStoreUpsertProps.ts";
import { DocStoreUpsertResult } from "./DocStoreUpsertResult.ts";

/**
 * Defines the functions that must be implemented by a document store.
 */
export interface DocStore<DocStoreOptions, Filter, Query> {
  /**
   * Delete a document using a document id.
   */
  deleteById: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: DocStoreOptions,
    props: DocStoreDeleteByIdProps,
  ) => Promise<DocStoreDeleteByIdResult>;

  /**
   * Determine if a document exists using a document id.
   */
  exists: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: DocStoreOptions,
    props: DocStoreExistsProps,
  ) => Promise<DocStoreExistsResult>;

  /**
   * Fetch a document using a document id.
   */
  fetch: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    id: string,
    options: DocStoreOptions,
    props: DocStoreFetchProps,
  ) => Promise<DocStoreFetchResult>;

  /**
   * Execute a query against a document collection.
   */
  query: (
    docTypeName: string,
    docTypePluralName: string,
    query: Query,
    options: DocStoreOptions,
    props: DocStoreQueryProps,
  ) => Promise<DocStoreQueryResult>;

  /**
   * Select all the documents of one document type from a collection.
   */
  selectAll: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Select the documents of one document type from a collection that
   * satisfy a given filter.
   */
  selectByFilter: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    filter: Filter,
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Select the documents of one document type from a collection using a set of document ids.
   */
  selectByIds: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    fieldNames: string[],
    ids: string[],
    options: DocStoreOptions,
    props: DocStoreSelectProps,
  ) => Promise<DocStoreSelectResult>;

  /**
   * Update or insert a document into a collection.
   */
  upsert: (
    docTypeName: string,
    docTypePluralName: string,
    partition: string,
    doc: DocRecord,
    options: DocStoreOptions,
    props: DocStoreUpsertProps,
  ) => Promise<DocStoreUpsertResult>;
}
