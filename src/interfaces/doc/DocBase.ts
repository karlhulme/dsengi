/**
 * Defines the system fields that are common to all documents
 * that can be sent to or returned from a document store.  All properties are
 * optional because they are populated at different points
 * in the creation dnd save process.  All the properties will
 * be populated in a retrieved document if all properties
 * are requested.
 */
export interface DocBase {
  /**
   * The id of the document.
   */
  id?: string;

  /**
   * The document type.
   */
  docType?: string;

  /**
   * The version of the document
   */
  docVersion?: string;

  /**
   * An array of operation ids that have been applied to this document.
   */
  docOpIds?: string[];
}
