import {
  DocBase,
  SengiConstructorFailedError,
  SengiConstructorNonObjectResponseError,
  SengiConstructorValidateParametersFailedError,
  SengiCtorParamsValidationFailedError,
} from "../../interfaces/index.ts";

/**
 * Returns a document constructed using the given constructor and params.
 * @param docTypeName The name of the document type.
 * @param validateParams A function for validating the parameters.
 * @param implementation The implementation of the constructor that returns a new document.
 * @param constructorParams The parameters to be passed to the constructor.
 * @param userId The id of the user making the request.
 */
export function executeConstructor<Doc extends DocBase, ConstructorParams>(
  docTypeName: string,
  validateParams: (params: unknown) => string | void,
  implementation: (params: ConstructorParams, userId: string) => Partial<Doc>,
  constructorParams: ConstructorParams,
  userId: string,
): Partial<Doc> {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateParams(constructorParams);
  } catch (err) {
    throw new SengiConstructorValidateParametersFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiCtorParamsValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  let result;

  try {
    result = implementation(constructorParams, userId);
  } catch (err) {
    throw new SengiConstructorFailedError(docTypeName, err);
  }

  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new SengiConstructorNonObjectResponseError(
      docTypeName,
    );
  }

  return result;
}
