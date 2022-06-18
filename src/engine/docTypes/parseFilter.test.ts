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
  User,
} from "../../interfaces/index.ts";
import { parseFilter } from "./parseFilter.ts";

const dummyUser: User = { id: "test-0001", claims: [] };

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
    ExampleFilter,
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
      } as DocTypeFilter<ExampleFilter, ExampleFilterParams>,
    },
  };

  return docType;
}

Deno.test("Produce filter object from valid filter params.", () => {
  assertEquals(
    parseFilter(createDocType(), dummyUser, "byPropA", { filterPropA: "abc" }),
    "abcFilter",
  );
});

Deno.test("Reject production of filter object for an unrecognised name.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), dummyUser, "unrecognised", {
        filterPropA: "abc",
      }),
    SengiUnrecognisedFilterNameError,
  );
});

Deno.test("Reject production of filter object if no filters defined.", () => {
  const docType = createDocType();
  delete docType.filters;
  assertThrows(
    () =>
      parseFilter(docType, dummyUser, "unrecognised", { filterPropA: "abc" }),
    SengiUnrecognisedFilterNameError,
  );
});

Deno.test("Reject production of filter object using invalid parameters.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), dummyUser, "byPropA", { filterPropA: 123 }),
    SengiFilterParamsValidationFailedError,
    "invalid filterPropA",
  );
});

Deno.test("Reject production of filter object if validation of parameters raises an error.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), dummyUser, "byPropA", {
        filterPropA: "err",
      }),
    SengiFilterValidateParametersFailedError,
    "validate-err",
  );
});

Deno.test("Reject production of filter object if operation raises error.", () => {
  assertThrows(
    () =>
      parseFilter(createDocType(), dummyUser, "byPropA", {
        filterPropA: "fail",
      }),
    SengiFilterParseFailedError,
    "fail",
  );
});
