import { PartialNullable } from "../generic/index.ts";

type OmittedDocFieldNames =
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
  | "docArchivedMillisecondsSinceEpoch";

/**
 * Defines the properties that are required to patch a document.
 */
export interface PatchDocumentProps<
  DocTypeNames extends string,
  Doc,
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
   * The id of a document.
   */
  id: string;

  /**
   * The id of the operation.
   */
  operationId: string;

  /**
   * A mechanism for providing idempotency when updating many
   * documents using identical parameters.  If updating documents in a
   * loop, pass the loop variable as the sequence number.
   */
  sequenceNo?: string;

  /**
   * The patch to be applied.
   */
  patch: Omit<PartialNullable<Doc>, OmittedDocFieldNames>;

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
