// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  SengiQueryParamsValidationFailedError,
  SengiQueryResponseValidationFailedError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    query: async () => 5,
  }, sengiCtorOverrides);
};

Deno.test("Execute a query on a document collection.", async () => {
  const { sengi, docStore } = createSengiForTests();

  const spyQuery = spy(docStore, "query");

  assertEquals(
    await sengi.queryDocuments<string, number>({
      ...defaultRequestProps,
      queryParams: "ALL",
      validateParams: () => {},
      parseParams: (params) => "QUERY " + params,
      coerceResult: (result) => result as number,
      validateResult: () => {},
    }),
    { data: 5 },
  );

  assertEquals(spyQuery.callCount, 1);
  assert(
    spyQuery.calledWith(
      "car",
      "QUERY ALL",
      { custom: "prop" },
    ),
  );
});

Deno.test("Fail to execute a query if the params are not valid.", async () => {
  const { sengi } = createSengiForTests();

  await assertRejects(
    () =>
      sengi.queryDocuments<string, number>({
        ...defaultRequestProps,
        queryParams: "ALL",
        validateParams: () => {
          return "invalid params";
        },
        parseParams: (params) => "QUERY " + params,
        coerceResult: (result) => result as number,
        validateResult: () => {},
      }),
    SengiQueryParamsValidationFailedError,
    "invalid params",
  );
});

Deno.test("Fail to execute query if the coerced results are not valid.", async () => {
  const { sengi } = createSengiForTests();

  await assertRejects(
    () =>
      sengi.queryDocuments<string, number>({
        ...defaultRequestProps,
        queryParams: "ALL",
        validateParams: () => {},
        parseParams: (params) => "QUERY " + params,
        coerceResult: (result) => result as number,
        validateResult: () => {
          return "invalid result";
        },
      }),
    SengiQueryResponseValidationFailedError,
    "invalid result",
  );
});
