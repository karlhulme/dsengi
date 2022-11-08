import { DocBase, DocStatuses } from "../../interfaces/index.ts";

/**
 * Ensures the given doc has a docOpIds array, a docDigests array
 * and values for the audit fields that cover when the document
 * was created and last updated.
 * @param doc A document.
 * @param millisecondsSinceEpoch The number of milliseconds since the Unix epoch.
 * @param userId The id of a user.
 */
export function applyCommonFieldValuesToDoc(
  doc: Partial<DocBase>,
  millisecondsSinceEpoch: number,
  userId: string,
  docVersion: string,
): void {
  // Ensure we have a doc status and assume active.
  if (!doc.docStatus) {
    doc.docStatus = DocStatuses.Active;
  }

  // We assign a new docVersion so that the document validates before
  // it is sent to the document store, whereby a new docVersion be assigned.
  doc.docVersion = docVersion;

  // Most mutations call appendDocOpId and appendDocIdempKey which will
  // ensure that the doc has an array of docOpIds, but the replaceDocument
  // operation will not so we include the safety check here.
  if (!Array.isArray(doc.docOpIds)) {
    doc.docOpIds = [];
  }

  if (!Array.isArray(doc.docDigests)) {
    doc.docDigests = [];
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
