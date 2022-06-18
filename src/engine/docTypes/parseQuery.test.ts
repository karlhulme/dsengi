// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  DocTypeQuery,
  SengiAuthorisationFailedError,
  SengiQueryParamsValidationFailedError,
  SengiQueryParseFailedError,
  SengiQueryValidateParametersFailedError,
  SengiUnrecognisedQueryNameError,
  User,
} from "../../interfaces/index.ts";
import { parseQuery } from "./parseQuery.ts";

const dummyUser: User = { id: "test-0001", claims: [] };

interface ExampleDoc extends DocBase {
  propA: string;
}

interface ExampleQueryParams {
  queryPropA: string;
}

type ExampleQuery = string;

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    ExampleQuery
  > = {
    name: "test",
    pluralName: "tests",
    queries: {
      count: {
        validateParameters: (params: any) => {
          if (typeof params.queryPropA !== "string") {
            return "invalid queryPropA";
          } else if (params.queryPropA === "err") {
            throw new Error("validate-err");
          }
        },
        parse: (props: any) => {
          if (props.parameters.queryPropA === "fail") {
            throw new Error("fail");
          }

          return props.parameters.queryPropA + "Query";
        },
        coerce: () => ({}),
        authorise: (props) => {
          if (props.parameters.queryPropA === "noAuth") {
            return "noAuth";
          }
        },
      } as DocTypeQuery<
        unknown,
        ExampleQueryParams,
        ExampleQuery
      >,
    },
  };

  return docType;
}

Deno.test("Produce query object from valid query params.", () => {
  assertEquals(
    parseQuery(createDocType(), dummyUser, "count", { queryPropA: "abc" }),
    "abcQuery",
  );
});

Deno.test("Reject production of query object for an unrecognised name.", () => {
  assertThrows(
    () =>
      parseQuery(createDocType(), dummyUser, "unrecognised", {
        queryPropA: "abc",
      }),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject production of query object if no queries defined.", () => {
  const docType = createDocType();
  delete docType.queries;
  assertThrows(
    () => parseQuery(docType, dummyUser, "unrecognised", { queryPropA: "abc" }),
    SengiUnrecognisedQueryNameError,
  );
});

Deno.test("Reject production of query object using invalid parameters.", () => {
  assertThrows(
    () => parseQuery(createDocType(), dummyUser, "count", { queryPropA: 123 }),
    SengiQueryParamsValidationFailedError,
    "invalid queryPropA",
  );
});

Deno.test("Reject production of query object if parameter validation raises error.", () => {
  assertThrows(
    () =>
      parseQuery(createDocType(), dummyUser, "count", { queryPropA: "err" }),
    SengiQueryValidateParametersFailedError,
    "validate-err",
  );
});

Deno.test("Reject production of query object if parsing raises error.", () => {
  assertThrows(
    () =>
      parseQuery(createDocType(), dummyUser, "count", { queryPropA: "fail" }),
    SengiQueryParseFailedError,
    "fail",
  );
});

Deno.test("Reject production of query object if authorisation fails.", () => {
  assertThrows(
    () =>
      parseQuery(createDocType(), dummyUser, "count", { queryPropA: "noAuth" }),
    SengiAuthorisationFailedError,
  );
});

Deno.test("Skip query authorisation if no authorisation method defined.", () => {
  const docType = createDocType();
  delete docType.queries?.count.authorise;
  assertEquals(
    parseQuery(docType, dummyUser, "count", { queryPropA: "noAuth" }),
    "noAuthQuery",
  );
});
