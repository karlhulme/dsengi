import {
  SengiUserValidationFailedError,
  SengiValiateUserFunctionError,
} from "../../interfaces/index.ts";

/**
 * Ensures the user object conforms to the given schema.
 * @param ajv A json validator.
 * @param userSchema A schema for the user object.
 * @param user: A user object.
 */
export function ensureUser<User>(
  user: unknown,
  validateUser?: (user: unknown) => string | void,
): User {
  if (typeof validateUser === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = validateUser(user);
    } catch (err) {
      throw new SengiValiateUserFunctionError(err);
    }

    if (validationErrorMessage) {
      throw new SengiUserValidationFailedError(validationErrorMessage);
    }
  }

  return user as User;
}
