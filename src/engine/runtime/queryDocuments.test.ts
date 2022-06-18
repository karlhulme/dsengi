// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    query: async () => ({ data: 5 }),
  }, sengiCtorOverrides);
};

Deno.test("Execute a query on a document collection.", async () => {
  const { sengi, docStore } = createSengiForTests();

  const spyQuery = spy(docStore, "query");

  assertEquals(
    await sengi.queryDocuments({
      ...defaultRequestProps,
      queryName: "count",
      queryParams: "ALL",
    }),
    { data: 5 },
  );

  assertEquals(spyQuery.callCount, 1);
  assert(
    spyQuery.calledWith("car", "cars", "COUNT ALL", { custom: "prop" }, {}),
  );
});

Deno.test("Fail to execute query if permissions insufficient.", async () => {
  const { sengi } = createSengiForTests();

  await assertRejects(() =>
    sengi.queryDocuments({
      ...defaultRequestProps,
      apiKey: "noneKey",
      queryName: "count",
      queryParams: "ALL",
    }), SengiInsufficientPermissionsError);
});

Deno.test("Fail to execute query if client api key is not recognised.", async () => {
  const { sengi } = createSengiForTests();

  await assertRejects(() =>
    sengi.queryDocuments({
      ...defaultRequestProps,
      apiKey: "unknown",
      queryName: "count",
      queryParams: "ALL",
    }), SengiUnrecognisedApiKeyError);
});
