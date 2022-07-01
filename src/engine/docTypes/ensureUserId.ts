import {
  SengiUserIdValidationFailedError,
  SengiValidateUserIdFunctionError,
} from "../../interfaces/index.ts";

/**
 * Applies the given patch to the given document.  The patch may produce fields that
 * are not valid for the overall document, if these are not corrected by the preSave
 * then an error will be raised when the document is validated.
 * @param userId The id of a user making a request.
 * @param validateUserId A function that returns a validation error
 * if the given user id is not valid.
 */
export function ensureUserId(
  userId: string,
  validateUserId: (userId: string) => string | void,
): void {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateUserId(userId);
  } catch (err) {
    throw new SengiValidateUserIdFunctionError(
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiUserIdValidationFailedError(
      userId,
      validationErrorMessage,
    );
  }
}
