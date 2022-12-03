import { DocStoreUpsertResultCode } from "./DocStoreUpsertResultCode.ts";

/**
 * The result from a document store of upserting a document.
 */
export interface DocStoreUpsertResult {
  /**
   * A result code that indicates if a document was upserted.
   */
  code: DocStoreUpsertResultCode;

  /**
   * A session token generated by the document store.
   * Specify this value on subsequent reads to ensure
   * the results reflect this operation.
   */
  sessionToken: string;
}
