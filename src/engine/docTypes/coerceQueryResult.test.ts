import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  SengiQueryCoerceFailedError,
  SengiQueryResponseValidationFailedError,
  SengiQueryValidateResponseFailedError,
} from "../../interfaces/index.ts";
import { coerceQueryResult } from "./coerceQueryResult.ts";

interface ExampleQueryResult {
  propA: string;
}

Deno.test("Coerce query result into response.", () => {
  assertEquals(
    coerceQueryResult<ExampleQueryResult>(
      "test",
      () => ({ propA: "foo" }),
      () => {},
      {},
    ),
    { propA: "foo" },
  );
});

Deno.test("Reject coercion of query result if query coercion raises errors.", () => {
  assertThrows(
    () =>
      coerceQueryResult<ExampleQueryResult>(
        "test",
        () => {
          throw new Error("coerce threw");
        },
        () => {},
        {},
      ),
    SengiQueryCoerceFailedError,
    "coerce threw",
  );
});

Deno.test("Reject coercion of query result if returned value does not pass validation.", () => {
  assertThrows(
    () =>
      coerceQueryResult<ExampleQueryResult>(
        "test",
        () => ({
          propA: "foo",
        }),
        () => {
          return "invalid result";
        },
        {},
      ),
    SengiQueryResponseValidationFailedError,
    "invalid result",
  );
});

Deno.test("Reject coercion of query result if returned value causes validation to raise an error.", () => {
  assertThrows(
    () =>
      coerceQueryResult<ExampleQueryResult>(
        "test",
        () => ({
          propA: "foo",
        }),
        () => {
          throw new Error("validation threw");
        },
        {},
      ),
    SengiQueryValidateResponseFailedError,
    "validation threw",
  );
});
