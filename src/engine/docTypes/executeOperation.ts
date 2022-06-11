import {
  AnyDocType,
  DocRecord,
  SengiOperationFailedError,
  SengiOperationParamsValidationFailedError,
  SengiOperationValidateParametersFailedError,
  SengiUnrecognisedOperationNameError,
} from "../../interfaces/index.ts";
import { ensureDocTypeOperationRequestAuthorised } from "./ensureDocTypeRequestAuthorised.ts";

/**
 * Execute an operation on a document.
 * @param docType A document type.
 * @param user A user object.
 * @param operationName The name of an operation.
 * @param operationParams A set of operation params.
 * @param doc The document to operation on.
 */
export function executeOperation(
  docType: AnyDocType,
  user: unknown,
  operationName: string,
  operationParams: unknown,
  doc: DocRecord,
): void {
  const operation = docType.operations?.[operationName];

  if (typeof operation !== "object") {
    throw new SengiUnrecognisedOperationNameError(docType.name, operationName);
  }

  if (typeof operation.validateParameters === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = operation.validateParameters(operationParams);
    } catch (err) {
      throw new SengiOperationValidateParametersFailedError(
        docType.name,
        operationName,
        err,
      );
    }

    if (validationErrorMessage) {
      throw new SengiOperationParamsValidationFailedError(
        docType.name,
        operationName,
        validationErrorMessage,
      );
    }
  }

  ensureDocTypeOperationRequestAuthorised(docType, operationName, operation, {
    doc,
    user,
    parameters: operationParams,
  });

  try {
    operation.implementation({ doc, user, parameters: operationParams });
  } catch (err) {
    throw new SengiOperationFailedError(
      docType.name,
      operationName,
      err as Error,
    );
  }
}
