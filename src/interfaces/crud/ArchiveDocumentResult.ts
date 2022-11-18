import { DocBase } from "../../interfaces/index.ts";
import { DocChange } from "../doc/index.ts";

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

  /**
   * The details of the change.
   * This will be populated if the docType trackChanges property is true.
   */
  change: DocChange<Doc> | null;
}
