import { DocBase } from "../../interfaces/index.ts";

/**
 * Ensures the given doc has a docOpIds array and values for the audit fields
 * that cover when the document was created and last updated.
 * @param doc A document.
 * @param millisecondsSinceEpoch The number of milliseconds since the Unix epoch.
 * @param userId The id of a user.
 */
export function applyCommonFieldValuesToDoc(
  doc: Partial<DocBase>,
  millisecondsSinceEpoch: number,
  userId: string,
): void {
  // Most mutations call appendDocOpId which will ensure that the doc
  // has an array of docOpIds, but the replaceDocument operation will not
  // so we include the safety check here.
  if (!Array.isArray(doc.docOpIds)) {
    doc.docOpIds = [];
  }

  if (!doc.docCreatedMillisecondsSinceEpoch) {
    doc.docCreatedMillisecondsSinceEpoch = millisecondsSinceEpoch;
  }

  if (!doc.docCreatedByUserId) {
    doc.docCreatedByUserId = userId;
  }

  doc.docLastUpdatedMillisecondsSinceEpoch = millisecondsSinceEpoch;
  doc.docLastUpdatedByUserId = userId;
}
