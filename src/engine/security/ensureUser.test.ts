import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  SengiUserClaimsValidationFailedError,
  SengiUserIdValidationFailedError,
  SengiValidateUserClaimsFunctionError,
  SengiValidateUserIdFunctionError,
} from "../../interfaces/index.ts";
import { ensureUser } from "./ensureUser.ts";

function validateUserId(userId: string) {
  if (userId.startsWith("_")) {
    return "invalid user id";
  } else if (userId === "err") {
    throw new Error("userId-err");
  }
}

function validateUserClaims(userClaims: string[]) {
  if (userClaims.length === 1 && userClaims[0].startsWith("_")) {
    return "invalid user claims";
  } else if (userClaims.length === 1 && userClaims[0] === "err") {
    throw new Error("userClaims-err");
  }
}

Deno.test("Accept a valid user.", () => {
  assertEquals(
    ensureUser("0001", validateUserId, ["claim"], validateUserClaims),
    {
      id: "0001",
      claims: ["claim"],
    },
  );
});

Deno.test("Reject a user with a non-string user id.", () => {
  assertThrows(
    () => ensureUser(123, validateUserId, ["claim"], validateUserClaims),
    SengiUserIdValidationFailedError,
    "userId must be a string",
  );
});

Deno.test("Reject a user with an invalid user id.", () => {
  assertThrows(
    () => ensureUser("_invalid", validateUserId, ["claim"], validateUserClaims),
    SengiUserIdValidationFailedError,
    "invalid user id",
  );
});

Deno.test("Wrap an error thrown by validate user id.", () => {
  assertThrows(
    () => ensureUser("err", validateUserId, ["claim"], validateUserClaims),
    SengiValidateUserIdFunctionError,
    "userId-err",
  );
});

Deno.test("Reject a user with a non-string array set of claims.", () => {
  assertThrows(
    () =>
      ensureUser("0001", validateUserId, ["valid", 123], validateUserClaims),
    SengiUserClaimsValidationFailedError,
    "element of the userClaims array must be a string",
  );
});

Deno.test("Reject a user with an invalid user claims.", () => {
  assertThrows(
    () => ensureUser("0001", validateUserId, ["_invalid"], validateUserClaims),
    SengiUserClaimsValidationFailedError,
    "invalid user claims",
  );
});

Deno.test("Wrap an error thrown by validate user claims.", () => {
  assertThrows(
    () => ensureUser("0001", validateUserId, ["err"], validateUserClaims),
    SengiValidateUserClaimsFunctionError,
    "userClaims-err",
  );
});
