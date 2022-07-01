/**
 * Defines the system fields that are common to all documents.
 */
export interface DocBase {
  /**
   * The id of the document.
   */
  id: string;

  /**
   * The document type.
   */
  docType: string;

  /**
   * The version of the document
   */
  docVersion: string;

  /**
   * An array of operation ids that have been applied to this document.
   */
  docOpIds: string[];

  /**
   * The number of milliseconds that have elapsed between the unix epoch
   * and the document being created.
   */
  docCreatedMillisecondsSinceEpoch: number;

  /**
   * The id of the user that created the document.
   */
  docCreatedByUserId: string;

  /**
   * The number of milliseconds that have elapsed between the unix epoch
   * and the document being last updated.
   */
  docLastUpdatedMillisecondsSinceEpoch: number;

  /**
   * The id of the user that last updated the document.
   */
  docLastUpdatedByUserId: string;
}
