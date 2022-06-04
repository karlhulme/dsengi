import {
  AnyDocType,
  DocRecord,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the given document does not have an id and
 * the correct value for docType, otherwise this function ensures that
 * all the system fields are set.
 * @param docType A document type.
 * @param doc A document.
 */
export function ensureDoc(docType: AnyDocType, doc: DocRecord): void {
  if (typeof doc.id !== "string") {
    throw new SengiDocValidationFailedError(
      docType.name,
      "Document must have id property of type string.",
    );
  }

  if (doc.docType !== docType.name) {
    throw new SengiDocValidationFailedError(
      docType.name,
      `Document must have docType equal to ${docType.name}.`,
    );
  }

  // appendDocOpId and applyCommonFieldValuesToDoc both repair docOpIds so this check
  // should only fail if validateDoc or preSave corrupts this field.
  if (!Array.isArray(doc.docOpIds)) {
    throw new SengiDocValidationFailedError(
      docType.name,
      `Document must have docOpIds property of type array.`,
    );
  }

  // applyCommonFieldValuesToDoc repairs these fields so these checks should only fail if validateDoc or preSave corrupts these field.
  if (typeof doc.docCreatedMillisecondsSinceEpoch !== "number") {
    throw new SengiDocValidationFailedError(
      docType.name,
      "Document must have docCreatedMillisecondsSinceEpoch property of type number.",
    );
  }
  if (typeof doc.docCreatedByUserId !== "string") {
    throw new SengiDocValidationFailedError(
      docType.name,
      "Document must have docCreatedByUserId property of type string.",
    );
  }
  if (typeof doc.docLastUpdatedMillisecondsSinceEpoch !== "number") {
    throw new SengiDocValidationFailedError(
      docType.name,
      "Document must have docLastUpdatedMillisecondsSinceEpoch property of type number.",
    );
  }
  if (typeof doc.docLastUpdatedByUserId !== "string") {
    throw new SengiDocValidationFailedError(
      docType.name,
      "Document must have docLastUpdatedByUserId property of type string.",
    );
  }
}
