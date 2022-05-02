// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  DocTypeFilter,
  SengiFilterParamsValidationFailedError,
  SengiFilterParseFailedError,
  SengiFilterValidateParametersFailedError,
  SengiUnrecognisedFilterNameError,
} from "../../interfaces/index.ts";
import { parseFilter } from "./parseFilter.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

interface ExampleFilterParams {
  filterPropA: string;
}

type ExampleFilter = string;

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    ExampleFilter,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    filters: {
      byPropA: {
        validateParameters: (params: any) => {
          if (typeof params.filterPropA !== "string") {
            return "invalid filterPropA";
          } else if (params.filterPropA === "err") {
            throw new Error("validate-err");
          }
        },
        parse: (props) => {
          if (props.parameters.filterPropA === "fail") {
            throw new Error("fail");
          }

          return props.parameters.filterPropA + "Filter";
        },
      } as DocTypeFilter<unknown, ExampleFilter, ExampleFilterParams>,
    },
  };

  return docType;
}

Deno.test("Produce filter object from valid filter params.", () => {
  assertEquals(
    parseFilter(createDocType(), null, "byPropA", { filterPropA: "abc" }),
    "abcFilter",
  );
});

Deno.test("Reject production of filter object for an unrecognised name.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), null, "unrecognised", {
        filterPropA: "abc",
      }),
    SengiUnrecognisedFilterNameError,
  );
});

Deno.test("Reject production of filter object if no filters defined.", () => {
  const docType = createDocType();
  delete docType.filters;
  assertThrows(
    () => parseFilter(docType, null, "unrecognised", { filterPropA: "abc" }),
    SengiUnrecognisedFilterNameError,
  );
});

Deno.test("Reject production of filter object using invalid parameters.", () => {
  assertThrows(
    () => parseFilter(createDocType(), null, "byPropA", { filterPropA: 123 }),
    SengiFilterParamsValidationFailedError,
    "invalid filterPropA",
  );
});

Deno.test("Reject production of filter object if validation of parameters raises an error.", () => {
  assertThrows(
    () => parseFilter(createDocType(), null, "byPropA", { filterPropA: "err" }),
    SengiFilterValidateParametersFailedError,
    "validate-err",
  );
});

Deno.test("Reject production of filter object if operation raises error.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), null, "byPropA", { filterPropA: "fail" }),
    SengiFilterParseFailedError,
    "fail",
  );
});
