import { DocStoreRecord } from "./DocStoreRecord.ts";

/**
 * The result from a document store of select a set of documents.
 */
export interface DocStoreSelectResult {
  /**
   * A collection of document fragments.
   */
  docs: DocStoreRecord[];
}
