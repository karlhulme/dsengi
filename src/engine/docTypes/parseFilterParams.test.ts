import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  SengiFilterParamsValidationFailedError,
  SengiFilterParseFailedError,
  SengiFilterValidateParametersFailedError,
} from "../../interfaces/index.ts";
import { parseFilterParams } from "./parseFilterParams.ts";

interface ExampleFilterParams {
  filterPropA: string;
}

type ExampleFilter = string;

Deno.test("Produce filter object from valid filter params.", () => {
  const filter = parseFilterParams<ExampleFilter, ExampleFilterParams>(
    "test",
    () => {},
    (params) => params.filterPropA,
    {
      filterPropA: "foo",
    },
    "me",
  );

  assertEquals(filter, "foo");
});

Deno.test("Reject production of filter object using invalid parameters.", () => {
  assertThrows(
    () =>
      parseFilterParams<ExampleFilter, ExampleFilterParams>(
        "test",
        () => {
          return "invalid params";
        },
        (params) => params.filterPropA,
        {
          filterPropA: "foo",
        },
        "me",
      ),
    SengiFilterParamsValidationFailedError,
    "invalid params",
  );
});

Deno.test("Reject production of filter object if validation of parameters raises an error.", () => {
  assertThrows(
    () =>
      parseFilterParams<ExampleFilter, ExampleFilterParams>(
        "test",
        () => {
          throw new Error("validation threw");
        },
        (params) => params.filterPropA,
        {
          filterPropA: "foo",
        },
        "me",
      ),
    SengiFilterValidateParametersFailedError,
    "validation threw",
  );
});

Deno.test("Reject production of filter object if implementation raises error.", () => {
  assertThrows(
    () =>
      parseFilterParams<ExampleFilter, ExampleFilterParams>(
        "test",
        () => {},
        () => {
          throw new Error("implementation threw");
        },
        {
          filterPropA: "foo",
        },
        "me",
      ),
    SengiFilterParseFailedError,
    "implementation threw",
  );
});
