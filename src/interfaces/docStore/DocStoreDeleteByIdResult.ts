import { DocStoreDeleteByIdResultCode } from "./DocStoreDeleteByIdResultCode.ts";

/**
 * The result from a document store of deleting a document.
 */
export interface DocStoreDeleteByIdResult {
  /**
   * A result code that indicates if a document was deleted.
   */
  code: DocStoreDeleteByIdResultCode;
}
