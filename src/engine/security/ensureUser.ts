import {
  SengiUserClaimsValidationFailedError,
  SengiUserIdValidationFailedError,
  SengiValidateUserClaimsFunctionError,
  SengiValidateUserIdFunctionError,
  User,
} from "../../interfaces/index.ts";

/**
 * Ensures the user object conforms to the given schema.
 * @param userId The id of the user.
 * @param validateUserId A function that validates the id of a user.
 * @param userClaims The claims of the user.
 * @param validateUserClaims A function that validates the claims of a user.
 */
export function ensureUser(
  userId: unknown,
  validateUserId: ((userId: string) => string | void) | null,
  userClaims: unknown,
  validateUserClaims: ((userClaims: string[]) => string | void) | null,
): User {
  if (typeof userId !== "string") {
    throw new SengiUserIdValidationFailedError("The userId must be a string.");
  }

  if (typeof validateUserId === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = validateUserId(userId);
    } catch (err) {
      throw new SengiValidateUserIdFunctionError(err);
    }

    if (validationErrorMessage) {
      throw new SengiUserIdValidationFailedError(validationErrorMessage);
    }
  }

  if (!Array.isArray(userClaims)) {
    throw new SengiValidateUserClaimsFunctionError(
      new Error("The userClaims must be an array."),
    );
  }

  if (userClaims.find((claim) => typeof claim !== "string")) {
    throw new SengiUserClaimsValidationFailedError(
      "Every element of the userClaims array must be a string.",
    );
  }

  if (typeof validateUserClaims === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = validateUserClaims(userClaims);
    } catch (err) {
      throw new SengiValidateUserClaimsFunctionError(err);
    }

    if (validationErrorMessage) {
      throw new SengiUserClaimsValidationFailedError(validationErrorMessage);
    }
  }

  return {
    id: userId as string,
    claims: userClaims as string[],
  };
}
