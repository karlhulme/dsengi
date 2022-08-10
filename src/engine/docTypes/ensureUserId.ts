import {
  SengiUserIdValidationFailedError,
  SengiValidateUserIdFunctionError,
} from "../../interfaces/index.ts";

/**
 * Verifies that the given userId can be validated
 * by the given validateUserId function.
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
