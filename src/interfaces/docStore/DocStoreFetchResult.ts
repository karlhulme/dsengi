import { DocStoreRecord } from "./DocStoreRecord.ts";

/**
 * The result of fetching a document from a document store.
 */
export interface DocStoreFetchResult {
  /**
   * The retrieved document.
   */
  doc: DocStoreRecord | null;
}
