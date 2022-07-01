import {
  DocBase,
  SengiOperationFailedError,
  SengiOperationParamsValidationFailedError,
  SengiOperationValidateParametersFailedError,
} from "../../interfaces/index.ts";

/**
 * Operates on the given document using the given operation.
 * @param docTypeName The name of the document type.
 * @param validateParams A function that validates the parameters.
 * @param implementation A function that operates on a document.
 * @param doc The document to be operated upon.
 * @param operationParams The parameters to be passed to the implementation function.
 */
export function executeOperation<Doc extends DocBase, OperationParams>(
  docTypeName: string,
  validateParams: (params: unknown) => string | void,
  implementation: (doc: Doc, params: OperationParams, userId: string) => void,
  doc: Doc,
  operationParams: OperationParams,
  userId: string,
): void {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateParams(operationParams);
  } catch (err) {
    throw new SengiOperationValidateParametersFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiOperationParamsValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  try {
    implementation(doc, operationParams, userId);
  } catch (err) {
    throw new SengiOperationFailedError(
      docTypeName,
      err as Error,
    );
  }
}
