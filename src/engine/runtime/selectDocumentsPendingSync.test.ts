// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    selectPendingSync: async () => ({
      docHeaders: [
        {
          id: "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
          docVersion: "0001",
          partition: "testPartition",
          docType: "car",
        },
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          docVersion: "0001",
          partition: "testPartition",
          docType: "car",
        },
      ],
    }),
  }, sengiCtorOverrides);
};

Deno.test("Select document headers for documents pending synchronization.", async () => {
  const { sengi, docStore } = createSengiForTests();

  const spySelectPendingSync = spy(docStore, "selectPendingSync");

  assertEquals(
    await sengi.selectDocumentsPendingSync({
      ...defaultRequestProps,
    }),
    {
      docHeaders: [
        {
          id: "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
          docVersion: "0001",
          partition: "testPartition",
          docType: "car",
        },
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          docVersion: "0001",
          partition: "testPartition",
          docType: "car",
        },
      ],
    },
  );

  assertEquals(spySelectPendingSync.callCount, 1);
  assert(
    spySelectPendingSync.calledWith(
      "car",
      { custom: "prop" },
    ),
  );
});
