import {
  AnyDocType,
  DocRecord,
  SengiDocValidationFailedError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";

/**
 * Executes the validator function on the given doc type if
 * one is defined and that will raise an error if the validation
 * fails.
 * @param docType A doc type.
 * @param doc A document.
 */
export function executeValidateDoc(docType: AnyDocType, doc: DocRecord): void {
  if (typeof docType.validateDoc === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = docType.validateDoc(doc);
    } catch (err) {
      throw new SengiValidateDocFailedError(docType.name, err);
    }

    if (validationErrorMessage) {
      throw new SengiDocValidationFailedError(
        docType.name,
        validationErrorMessage,
      );
    }
  }
}
