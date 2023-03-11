/**
 * Defines the properties that are required to extract all
 * the patches for a specific document from a collection.
 */
export interface SelectPatchesProps {
  /**
   * The id of the document for which all patch records
   * should be retrieved.
   */
  documentId: string;
}
