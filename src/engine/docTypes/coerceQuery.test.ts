// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  SengiQueryCoerceFailedError,
  SengiQueryResponseValidationFailedError,
  SengiQueryValidateResponseFailedError,
  SengiUnrecognisedQueryNameError,
} from "../../interfaces/index.ts";
import { coerceQuery } from "./coerceQuery.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    queries: {
      count: {
        parse: () => ({}),
        validateResponse: (response: any) => {
          if (typeof response.queryResponseA !== "number") {
            return "validate-invalid";
          } else if (response.queryResponseA === -1) {
            throw new Error("validate-err");
          }
        },
        coerce: (queryResult) => {
          if (queryResult === "break") {
            throw new Error("break");
          }

          if (queryResult === "invalid") {
            return { queryResponseA: "invalid" };
          }

          if (queryResult === "error") {
            return { queryResponseA: -1 };
          }

          return { queryResponseA: 123 };
        },
      },
    },
  };

  return docType;
}

Deno.test("Coerce query result into response.", () => {
  assertEquals(
    coerceQuery(createDocType(), "count", "good"),
    { queryResponseA: 123 },
  );
});

Deno.test("Reject coercion of query result for an unrecognised name.", () => {
  assertThrows(
    () =>
      coerceQuery(createDocType(), "unrecognised", "good"),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject coercion of query result if no queries defined.", () => {
  const docType = createDocType();
  delete docType.queries;
  assertThrows(
    () => coerceQuery(docType, "unrecognised", "good"),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject coercion of query result if query coercion raises errors.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", "break"),
    SengiQueryCoerceFailedError,
    "break",
  );
});

Deno.test("Reject coercion of query result if returned value does not pass validation.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", "invalid"),
    SengiQueryResponseValidationFailedError,
    "validate-invalid",
  );
});

Deno.test("Reject coercion of query result if returned value causes validation to raise an error.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", "error"),
    SengiQueryValidateResponseFailedError,
    "validate-err",
  );
});
