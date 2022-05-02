import {
  AnyDocType,
  DocRecord,
  SengiConstructorFailedError,
  SengiConstructorNonObjectResponseError,
  SengiConstructorValidateParametersFailedError,
  SengiCtorParamsValidationFailedError,
  SengiUnrecognisedCtorNameError,
} from "../../interfaces/index.ts";

/**
 * Execute a constructor to produce a new document.
 * @param docType A document type.
 * @param user A user object.
 * @param constructorName The name of a constructor.
 * @param constructorParams A set of constructor params.
 */
export function executeConstructor(
  docType: AnyDocType,
  user: unknown,
  constructorName: string,
  constructorParams: unknown,
): DocRecord {
  const ctor = docType.constructors?.[constructorName];

  if (typeof ctor !== "object") {
    throw new SengiUnrecognisedCtorNameError(docType.name, constructorName);
  }

  if (typeof ctor.validateParameters === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = ctor.validateParameters(constructorParams);
    } catch (err) {
      throw new SengiConstructorValidateParametersFailedError(
        docType.name,
        constructorName,
        err,
      );
    }

    if (validationErrorMessage) {
      throw new SengiCtorParamsValidationFailedError(
        docType.name,
        constructorName,
        validationErrorMessage,
      );
    }
  }

  let result;

  try {
    result = ctor.implementation({ user, parameters: constructorParams });
  } catch (err) {
    throw new SengiConstructorFailedError(docType.name, constructorName, err);
  }

  if (typeof result !== "object" || result === null || Array.isArray(result)) {
    throw new SengiConstructorNonObjectResponseError(
      docType.name,
      constructorName,
    );
  }

  return result;
}
