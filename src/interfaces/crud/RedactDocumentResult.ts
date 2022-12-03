import { DocBase, DocChange } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to redact a document.
 */
export interface RedactDocumentResult<Doc extends DocBase> {
  /**
   * True if a document was redacted.
   */
  isRedacted: boolean;

  /**
   * The updated document.
   */
  doc: Doc;

  /**
   * The details of the change.
   * This will be populated if the docType trackChanges property is true.
   */
  change: DocChange<Doc> | null;
}
