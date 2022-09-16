import { DocBase } from "../doc/index.ts";

type OmittedDocFieldNames =
  | "docType"
  | "docStatus"
  | "docVersion"
  | "docOpIds"
  | "docCreatedByUserId"
  | "docCreatedMillisecondsSinceEpoch"
  | "docLastUpdatedByUserId"
  | "docLastUpdatedMillisecondsSinceEpoch"
  | "docArchivedByUserId"
  | "docArchivedMillisecondsSinceEpoch"
  | "docLastSyncedMillisecondsSinceEpoch";

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
   * The new document.  All of the system fields will be added automatically
   * expect for the id property which must be populated.
   */
  doc: Partial<Omit<Doc, OmittedDocFieldNames>>;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
