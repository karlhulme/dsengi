// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
  SengiConflictOnSaveError,
  SengiDocNotFoundError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTest = (
  upsertResponse?: DocStoreUpsertResult,
  sengiCtorOverrides?: Record<string, unknown>,
) => {
  return createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
        docStatus: "active",
        docVersion: "aaaa",
        docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      },
    }),
    upsert: async () =>
      upsertResponse || ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, sengiCtorOverrides);
};

Deno.test("Archiving a document should call fetch and upsert on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docStatus: "archived",
    docVersion: "1111-2222",
    docOpIds: [
      "50e02b33-b22c-4207-8785-5a8aa529ec84",
    ],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docArchivedByUserId: "user-0001",
    docArchivedMillisecondsSinceEpoch: 1629881470000,
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.archiveDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    }),
    {
      isArchived: true,
      doc: resultDoc,
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
  ));

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "_central",
    resultDoc,
    "aaaa",
    { custom: "prop" },
  ));
});

Deno.test("Archiving a document that is already archived will only fetch on the doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
        docStatus: "archived",
        docVersion: "aaaa",
        docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
        docArchivedByUserId: "user-test",
        docArchivedMillisecondsSinceEpoch: 1451881471234,
      },
    }),
  });

  createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.archiveDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(result.isArchived, false);
  assertEquals(result.doc.id, "06151119-065a-4691-a7c8-2d84ec746ba9");

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
  ));

  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to archive a document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await assertRejects(() =>
    sengi.archiveDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    }), SengiConflictOnSaveError);
});

Deno.test("Reject an attempt to archive a non-existent doc.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(() =>
    sengi.archiveDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
    }), SengiDocNotFoundError);
});
