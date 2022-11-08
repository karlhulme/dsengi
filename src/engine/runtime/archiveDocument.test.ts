// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
  spy,
} from "../../../deps.ts";
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

const createDoc = () => ({
  id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  docType: "car",
  docStatus: "active",
  docVersion: "aaaa",
  docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
  docDigests: [
    "9999:A0:6ac951d1db683edc4a3bde31842608f45919b6b4",
  ],
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
});

const createSengiForTest = (
  upsertResponse?: DocStoreUpsertResult,
  sengiCtorOverrides?: Record<string, unknown>,
) => {
  return createSengiWithMockStore({
    fetch: async () => ({
      doc: createDoc(),
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
      "00000000-0000-0000-0000-111122223333",
    ],
    docDigests: [
      "9999:A0:6ac951d1db683edc4a3bde31842608f45919b6b4",
      "3333:A0:2d049793436193a9329dd590873023a004d10d48",
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
      operationId: "00000000-0000-0000-0000-111122223333",
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

Deno.test("Archiving a document is an idempotent operation.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyUpsert = spy(docStore, "upsert");

  await sengi.archiveDocument<Car>({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122229999",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(spyUpsert.callCount, 0);
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
        docDigests: [],
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
    operationId: "00000000-0000-0000-0000-111122223333",
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
      operationId: "00000000-0000-0000-0000-111122223333",
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
      operationId: "00000000-0000-0000-0000-111122223333",
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
    }), SengiDocNotFoundError);
});

Deno.test("Raise an event when archiving a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "changeEvent") {
        return {
          doc: null,
        };
      } else {
        return {
          doc: createDoc(),
        };
      }
    },
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: async () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.archiveDocument<Car>({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  // First upsert is the event, second upsert is the doc being archived.
  assertEquals(spyUpsert.callCount, 2);

  assertEquals(spyUpsert.args[0][0], "changeEvent");
  assertEquals(spyUpsert.args[0][1], "_central");
  assertObjectMatch(spyUpsert.args[0][2], {
    action: "archive",
    changeUserId: "user-0001",
    digest: "3333:A0:2d049793436193a9329dd590873023a004d10d48",
    postChangeFields: {},
    preChangeFields: {
      manufacturer: "ford",
    },
    subjectDocType: "car",
    subjectId: "06151119-065a-4691-a7c8-2d84ec746ba9",
    timestampInMilliseconds: 1629881470000,
  });
});

Deno.test("Raise a pre-saved event when archiving a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "changeEvent") {
        return {
          doc: {
            digest: "abcd",
            action: "archive",
            preChangeFields: {
              manufacturer: "ford",
            },
            subjectDocType: "car",
            timestampInMilliseconds: 1629881000000,
          },
        };
      } else {
        return {
          doc: createDoc(),
        };
      }
    },
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: async () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.archiveDocument<Car>({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    raiseChangeEventPartition: "diffPartition",
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  // Only one upsert because the event was retrieved
  assertEquals(spyUpsert.callCount, 1);
});
