// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
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
    await sengi.queryDocuments<number>({
      ...defaultRequestProps,
      query: "ALL",
      coerceResult: (result) => result as number,
    }),
    { data: 5 },
  );

  assertEquals(spyQuery.callCount, 1);

  assert(
    spyQuery.calledWith(
      "car",
      "ALL",
      { custom: "prop" },
    ),
  );
});
