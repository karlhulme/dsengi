import { assertThrows } from "../../../deps.ts";
import {
  SengiUserIdValidationFailedError,
  SengiValidateUserIdFunctionError,
} from "../../interfaces/index.ts";
import { ensureUserId } from "./ensureUserId.ts";

Deno.test("A valid user id is accepted.", () => {
  ensureUserId(
    "me",
    () => {},
  );
});

Deno.test("Reject user id that is invalid.", () => {
  assertThrows(
    () =>
      ensureUserId(
        "me",
        () => {
          return "invalid user id";
        },
      ),
    SengiUserIdValidationFailedError,
    "invalid user id",
  );
});

Deno.test("Reject user id if validation function fails.", () => {
  assertThrows(
    () =>
      ensureUserId(
        "me",
        () => {
          throw new Error("validation threw");
        },
      ),
    SengiValidateUserIdFunctionError,
    "validation threw",
  );
});
