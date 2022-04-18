import { DocStoreUpsertResultCode } from "./DocStoreUpsertResultCode.ts";

/**
 * The result from a document store of upserting a document.
 */
export interface DocStoreUpsertResult {
  /**
   * A result code that indicates if a document was upserted.
   */
  code: DocStoreUpsertResultCode;
}
