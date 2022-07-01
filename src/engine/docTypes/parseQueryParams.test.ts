import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  SengiQueryParamsValidationFailedError,
  SengiQueryParseFailedError,
  SengiQueryValidateParametersFailedError,
} from "../../interfaces/index.ts";
import { parseQueryParams } from "./parseQueryParams.ts";

type ExampleQuery = string;

interface ExampleQueryParams {
  queryPropA: string;
}

Deno.test("Produce query object from valid query params.", () => {
  const query = parseQueryParams<ExampleQuery, ExampleQueryParams>(
    "test",
    () => {},
    (params) => params.queryPropA,
    {
      queryPropA: "foo",
    },
    "me",
  );

  assertEquals(query, "foo");
});

Deno.test("Reject production of query object using invalid parameters.", () => {
  assertThrows(
    () =>
      parseQueryParams<ExampleQuery, ExampleQueryParams>(
        "test",
        () => {
          return "invalid params";
        },
        (params) => params.queryPropA,
        {
          queryPropA: "foo",
        },
        "me",
      ),
    SengiQueryParamsValidationFailedError,
    "invalid params",
  );
});

Deno.test("Reject production of query object if parameter validation raises error.", () => {
  assertThrows(
    () =>
      parseQueryParams<ExampleQuery, ExampleQueryParams>(
        "test",
        () => {
          throw new Error("validation threw");
        },
        (params) => params.queryPropA,
        {
          queryPropA: "foo",
        },
        "me",
      ),
    SengiQueryValidateParametersFailedError,
    "validation threw",
  );
});

Deno.test("Reject production of query object if parsing raises error.", () => {
  assertThrows(
    () =>
      parseQueryParams<ExampleQuery, ExampleQueryParams>(
        "test",
        () => {},
        () => {
          throw new Error("implementation threw");
        },
        {
          queryPropA: "foo",
        },
        "me",
      ),
    SengiQueryParseFailedError,
    "implementation threw",
  );
});
