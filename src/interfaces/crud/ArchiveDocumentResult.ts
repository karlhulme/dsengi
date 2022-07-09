import { DocBase } from "../../interfaces/index.ts";

/**
 * Defines the shape of the response following a request to archive a document.
 */
export interface ArchiveDocumentResult<Doc extends DocBase> {
  /**
   * True if a document was archived.
   */
  isArchived: boolean;

  /**
   * The archived document.
   */
  doc: Doc;
}
