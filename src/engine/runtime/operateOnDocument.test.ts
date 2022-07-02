// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertRejects,
  match,
  spy,
} from "../../../deps.ts";
import {
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
  SengiConflictOnSaveError,
  SengiDocNotFoundError,
  SengiRequiredVersionNotAvailableError,
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
        docVersion: "aaaa",
        docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      },
    }),
    upsert: async () =>
      upsertResponse || ({ code: DocStoreUpsertResultCode.CREATED }),
  }, sengiCtorOverrides);
};

function defaultImplementation(doc: Car, params: number) {
  doc.model = doc.model + params.toString();
}

Deno.test("Operate on document should call fetch and upsert on doc store while retaining existing properties.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docVersion: "1111-2222",
    docOpIds: [
      "50e02b33-b22c-4207-8785-5a8aa529ec84",
      "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    ],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    manufacturer: "ford",
    model: "ka2",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.operateOnDocument<Car, number>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      validateParams: () => {},
      implementation: defaultImplementation,
      operationParams: 2,
    }),
    {
      isUpdated: true,
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
    null,
    { custom: "prop" },
  ));
});

Deno.test("Operating on a document with a recognised operation id should only call fetch on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.operateOnDocument<Car, number>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "50e02b33-b22c-4207-8785-5a8aa529ec84",
    validateParams: () => {},
    implementation: defaultImplementation,
    operationParams: 2,
  });

  assertEquals(result.isUpdated, false);
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

Deno.test("Operating on a document using a required version should cause required version to be passed to doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.operateOnDocument<Car, number>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    validateParams: () => {},
    implementation: defaultImplementation,
    operationParams: 2,
    reqVersion: "aaaa",
  });

  assertEquals(result.isUpdated, true);
  assertEquals(result.doc.id, "06151119-065a-4691-a7c8-2d84ec746ba9");

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
    match.object,
    "aaaa",
    { custom: "prop" },
  ));
});

Deno.test("Fail to operate on document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await assertRejects(async () => {
    await sengi.operateOnDocument<Car, number>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      validateParams: () => {},
      implementation: defaultImplementation,
      operationParams: 2,
      reqVersion: "bbbb", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then VersionNotAvailable error is raised
    });
  }, SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to operate on document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await assertRejects(async () => {
    await sengi.operateOnDocument<Car, number>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      validateParams: () => {},
      implementation: defaultImplementation,
      operationParams: 2,
      // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is NOT specified then conflictOnSave error is raised
    });
  }, SengiConflictOnSaveError);
});

Deno.test("Fail to operate on document if it does not exist.", async () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(async () => {
    await sengi.operateOnDocument<Car, number>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      validateParams: () => {},
      implementation: defaultImplementation,
      operationParams: 2,
    });
  }, SengiDocNotFoundError);
});
