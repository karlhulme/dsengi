import { DocBase } from "./DocBase.ts";
import { DocChangeAction } from "./DocChangeAction.ts";

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
 * Describes a change made to a document, once that
 * change has been completed.
 */
export interface DocChange<Doc extends DocBase> {
  /**
   * The id of the document that changed.
   */
  docId: string;

  /**
   * The action that led to the change operation.
   */
  action: DocChangeAction;

  /**
   * The digest derived from the change operation.
   */
  digest: string;

  /**
   * The number of milliseconds since the unix epoch when this
   * change was applied.
   */
  timestampInMilliseconds: number;

  /**
   * The id of the user that initiated the change to the document.
   */
  changeUserId: string;

  /**
   * For archive, delete and patch operations, this property will contain a subset of values
   * from the document, as determined by the changeFieldNames property on the docType,
   * just prior to the operation being carried out.
   * For create operations, the property will contain a subset of the new values for the document,
   * as determined by the changeFieldNames property on the docType.
   */
  fields: Partial<Omit<Doc, OmittedDocFieldNames>>;

  /**
   * For patch operations, this property will contain the subset of incoming patch values,
   * as determined by the changeFieldNames property on the docType.
   * For all other operations, this property will be an empty object.
   */
  patchFields: Partial<Omit<Doc, OmittedDocFieldNames>>;
}
