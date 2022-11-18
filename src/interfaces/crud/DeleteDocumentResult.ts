import { DocBase, DocChange } from "../index.ts";

/**
 * Defines the shape of the response following a request to delete a document.
 */
export interface DeleteDocumentResult<Doc extends DocBase> {
  /**
   * True if a document was deleted.
   */
  isDeleted: boolean;

  /**
   * The details of the change.
   * If you call delete on a previously deleted document where a
   * previously saved changeDoc is no longer available then null
   * will be returned.
   * This will be populated if the docType trackChanges property is true.
   */
  change: DocChange<Doc> | null;
}
