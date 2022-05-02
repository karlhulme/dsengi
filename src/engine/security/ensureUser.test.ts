import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  SengiUserValidationFailedError,
  SengiValiateUserFunctionError,
} from "../../interfaces/index.ts";
import { ensureUser } from "./ensureUser.ts";

function validateUser(user: unknown) {
  if (typeof user !== "number") {
    return "invalid user";
  } else if (user === -1) {
    throw new Error("user-err");
  }
}

Deno.test("Accept a valid user.", () => {
  assertEquals(ensureUser(12, validateUser), 12);
});

Deno.test("Reject a user of a invalid shape.", () => {
  assertThrows(
    () => ensureUser("not-a-number", validateUser),
    SengiUserValidationFailedError,
    "invalid user",
  );
});

Deno.test("Wrap an error thrown by validate user.", () => {
  assertThrows(
    () => ensureUser(-1, validateUser),
    SengiValiateUserFunctionError,
    "user-err",
  );
});
