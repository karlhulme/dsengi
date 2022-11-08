import { DocBase } from "../doc/index.ts";

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
  doc: Partial<Omit<Doc, OmittedDocFieldNames>>;

  /**
   * If supplied, this value will be used as the id of the new document.
   * This will be used instead of the generator function supplied for
   * the document type.  If a document with the given id already exists it
   * will be replaced.
   */
  explicitId?: string;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
