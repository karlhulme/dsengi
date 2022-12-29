import { DocBase } from "../doc/index.ts";

export type OmittedNewDocumentFieldNames =
  | "id"
  | "docType"
  | "docStatus"
  | "docVersion"
  | "docOpIds"
  | "docDigests"
  | "docCreatedByUserId"
  | "docCreatedMillisecondsSinceEpoch"
  | "docLastUpdatedByUserId"
  | "docLastUpdatedMillisecondsSinceEpoch"
  | "docArchivedByUserId"
  | "docArchivedMillisecondsSinceEpoch"
  | "docRedactedByUserId"
  | "docRedactedMillisecondsSinceEpoch";

/**
 * Defines the properties that are required to create
 * a new document from a fragment.
 */
export interface NewDocumentProps<
  DocTypeNames extends string,
  Doc extends DocBase,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: DocTypeNames;

  /**
   * The name of a document partition.
   */
  partition: string | null;

  /**
   * The id of the operation.
   */
  operationId: string;

  /**
   * A mechanism for providing idempotency when creating many
   * documents using identical parameters.  If creating documents in a
   * loop, pass the loop variable as the sequence number.
   */
  sequenceNo?: string;

  /**
   * The new document.  All of the system fields will be added automatically.
   */
  doc: Partial<Omit<Doc, OmittedNewDocumentFieldNames>>;

  /**
   * If supplied, this value will be used as the id of the new document.
   * This will be used instead of the generator function supplied for
   * the document type.  If a document with the given id already exists it
   * will be replaced.
   */
  explicitId?: string;

  /**
   * The required version of the document.  If specified, then this
   * property defines the version of the document that must be
   * found in the collection otherwise the operation will not be applied.
   */
  reqVersion?: string;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
