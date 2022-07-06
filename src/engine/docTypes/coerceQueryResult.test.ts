import { assertEquals, assertThrows } from "../../../deps.ts";
import { SengiQueryCoerceFailedError } from "../../interfaces/index.ts";
import { coerceQueryResult } from "./coerceQueryResult.ts";

interface ExampleQueryResult {
  propA: string;
}

Deno.test("Coerce query result into response.", () => {
  assertEquals(
    coerceQueryResult<ExampleQueryResult>(
      "test",
      () => ({ propA: "foo" }),
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
        {},
      ),
    SengiQueryCoerceFailedError,
    "coerce threw",
  );
});
