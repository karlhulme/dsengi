// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
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
    "9999:R0:f1291eb80b04845edf58fa3aa118f61f8c194b9c",
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

Deno.test("Redacting a document should call fetch and upsert on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docStatus: "active",
    docVersion: "1111-2222",
    docOpIds: [
      "50e02b33-b22c-4207-8785-5a8aa529ec84",
      "00000000-0000-0000-0000-111122223333",
    ],
    docDigests: [
      "9999:R0:f1291eb80b04845edf58fa3aa118f61f8c194b9c",
      "3333:R0:a49f163339d3c082e3d9c73fe71151aa6a2819e2",
    ],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docRedactedByUserId: "user-0001",
    docRedactedMillisecondsSinceEpoch: 1629881470000,
    manufacturer: "REDACT-001",
    model: "-",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.redactDocument<Car>({
      ...defaultRequestProps,
      operationId: "00000000-0000-0000-0000-111122223333",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      redactValue: "REDACT-001",
    }),
    {
      isRedacted: true,
      doc: resultDoc,
      change: null,
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

Deno.test("Archiving a document is an idempotent operation based on the digest on the doc.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyUpsert = spy(docStore, "upsert");

  await sengi.redactDocument<Car>({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122229999",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    redactValue: "REDACT-001",
  });

  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Reject an attempt to archive a non-existent doc.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(() =>
    sengi.redactDocument<Car>({
      ...defaultRequestProps,
      operationId: "00000000-0000-0000-0000-111122223333",
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
      redactValue: "REDACT-001",
    }), SengiDocNotFoundError);
});

Deno.test("Return changes when redacting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (docTypeName: string, _partition: string, _id: string) => {
        if (docTypeName === "change") {
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
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.redactDocument<Car>({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    redactValue: "REDACT-001",
  });

  assertEquals(result.change?.action, "redact");
  assertEquals(result.change?.docId, "06151119-065a-4691-a7c8-2d84ec746ba9");
  assertEquals(result.change?.fields, {
    manufacturer: "ford",
    model: "ka",
  });
  assertEquals(result.change?.patchFields, {});

  // Two upserts, one for change doc and one for the patched doc
  assertEquals(spyUpsert.callCount, 2);
});

Deno.test("Return a pre-saved change doc when redacting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (docTypeName: string, _partition: string, _id: string) => {
        if (docTypeName === "change") {
          return {
            doc: {
              digest: "abcd",
              action: "redact",
              docId: "efgh",
              fields: {
                manufacturer: "ford",
              },
              patchFields: {},
              timestampInMilliseconds: 1629881000000,
              changeUserId: "user_007",
            },
          };
        } else {
          return {
            doc: createDoc(),
          };
        }
      },
      upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.redactDocument<Car>({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    redactValue: "REDACT-001",
  });

  assertEquals(result.change?.action, "redact");

  // Only one upsert because the change data was retrieved
  assertEquals(spyUpsert.callCount, 1);
});
