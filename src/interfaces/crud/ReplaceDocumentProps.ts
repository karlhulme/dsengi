import { DocBase } from "../doc/index.ts";

export type OmittedReplaceDocumentFieldNames =
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
 * Defines the properties that are required to replace a document.
 */
export interface ReplaceDocumentProps<
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
   * A new document to be used in place of any existing document.
   */
  doc: Omit<Doc, OmittedReplaceDocumentFieldNames>;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
