import {
  DocBase,
  DocStatuses,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the given document is missing any of the
 * system fiels.  It also checks that the docTypeName is set correctly.
 * @param docTypeName The name of a document type.
 * @param doc A document.
 */
export function ensureDocSystemFields(docTypeName: string, doc: DocBase): void {
  if (typeof doc.id !== "string") {
    throw new SengiDocValidationFailedError(
      docTypeName,
      "Document must have id property of type string.",
    );
  }

  if (doc.docType !== docTypeName) {
    throw new SengiDocValidationFailedError(
      docTypeName,
      `Document must have docType equal to ${docTypeName}.`,
    );
  }

  if (
    doc.docStatus !== DocStatuses.Active &&
    doc.docStatus !== DocStatuses.Archived
  ) {
    throw new SengiDocValidationFailedError(
      docTypeName,
      `Document must have docStatus with value of 'active' or 'archived'.`,
    );
  }

  // appendDocOpId and applyCommonFieldValuesToDoc both repair docOpIds so this check
  // should only fail if validateDoc or preSave corrupts this field.
  if (!Array.isArray(doc.docOpIds)) {
    throw new SengiDocValidationFailedError(
      docTypeName,
      `Document must have docOpIds property of type array.`,
    );
  }

  // applyCommonFieldValuesToDoc repairs these fields so these checks should only fail if validateDoc or preSave corrupts these field.
  if (typeof doc.docCreatedMillisecondsSinceEpoch !== "number") {
    throw new SengiDocValidationFailedError(
      docTypeName,
      "Document must have docCreatedMillisecondsSinceEpoch property of type number.",
    );
  }
  if (typeof doc.docCreatedByUserId !== "string") {
    throw new SengiDocValidationFailedError(
      docTypeName,
      "Document must have docCreatedByUserId property of type string.",
    );
  }
  if (typeof doc.docLastUpdatedMillisecondsSinceEpoch !== "number") {
    throw new SengiDocValidationFailedError(
      docTypeName,
      "Document must have docLastUpdatedMillisecondsSinceEpoch property of type number.",
    );
  }
  if (typeof doc.docLastUpdatedByUserId !== "string") {
    throw new SengiDocValidationFailedError(
      docTypeName,
      "Document must have docLastUpdatedByUserId property of type string.",
    );
  }
}
