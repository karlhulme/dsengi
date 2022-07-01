import {
  DocBase,
  SengiDocValidationFailedError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";

/**
 * Executes the validator functions on the given doc.
 * @param docTypeName The name of the document type.
 * @param validateFields A function that validates the types and ranges
 * of the individual fields on the document.
 * @param validateDoc A function that validates the document as a whole,
 * considering how one field may affect valid values in other fields.
 * @param doc A document.
 */
export function executeValidateDoc<Doc extends DocBase>(
  docTypeName: string,
  validateFields: (doc: unknown) => string | void,
  validateDoc: (doc: unknown) => string | void,
  doc: Doc,
): void {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateFields(doc) || validateDoc(doc);
  } catch (err) {
    throw new SengiValidateDocFailedError(docTypeName, err);
  }

  if (validationErrorMessage) {
    throw new SengiDocValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }
}
