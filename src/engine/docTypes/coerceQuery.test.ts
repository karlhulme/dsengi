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

interface ExampleResult {
  queryResultA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown,
    unknown,
    ExampleResult
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
          if (queryResult.queryResultA === "break") {
            throw new Error("break");
          }

          if (queryResult.queryResultA === "invalid") {
            return { queryResponseA: "invalid" };
          }

          if (queryResult.queryResultA === "error") {
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
    coerceQuery(createDocType(), "count", { queryResultA: "good" }),
    { queryResponseA: 123 },
  );
});

Deno.test("Reject coercion of query result for an unrecognised name.", () => {
  assertThrows(
    () =>
      coerceQuery(createDocType(), "unrecognised", { queryResultA: "good" }),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject coercion of query result if no queries defined.", () => {
  const docType = createDocType();
  delete docType.queries;
  assertThrows(
    () => coerceQuery(docType, "unrecognised", { queryResultA: "good" }),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject coercion of query result if query coercion raises errors.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", { queryResultA: "break" }),
    SengiQueryCoerceFailedError,
    "break",
  );
});

Deno.test("Reject coercion of query result if returned value does not pass validation.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", { queryResultA: "invalid" }),
    SengiQueryResponseValidationFailedError,
    "validate-invalid",
  );
});

Deno.test("Reject coercion of query result if returned value causes validation to raise an error.", () => {
  assertThrows(
    () => coerceQuery(createDocType(), "count", { queryResultA: "error" }),
    SengiQueryValidateResponseFailedError,
    "validate-err",
  );
});
