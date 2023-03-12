/**
 * Defines the properties that are required to extract all
 * the patches for a specific document from a collection.
 */
export interface SelectPatchesProps {
  /**
   * The partition that the patches for the given document are stored in.
   */
  partition: string;

  /**
   * The id of the document for which all patch records
   * should be retrieved.
   */
  documentId: string;

  /**
   * If specified, patches should be retrieved after the patch with
   * the given id.
   */
  from?: string;

  /**
   * If specified, the number of patches to retrieve.
   */
  limit?: number;
}
