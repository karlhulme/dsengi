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
  SengiInsufficientPermissionsError,
  SengiRequiredVersionNotAvailableError,
  SengiUnrecognisedApiKeyError,
  SengiUnrecognisedOperationNameError,
} from "../../interfaces/index.ts";
import {
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

Deno.test("Operate on document should call fetch and upsert on doc store while retaining existing properties.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    }),
    { isUpdated: true },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ));

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docVersion: "aaaa",
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

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "cars",
    "_central",
    resultDoc,
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ));
});

Deno.test("Operating on a document should raise callbacks.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiForTest(undefined, {
    onPreSaveDoc,
    onSavedDoc,
  });

  assertEquals(
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    }),
    { isUpdated: true },
  );

  assertEquals(onPreSaveDoc.callCount, 1);
  assert(onPreSaveDoc.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    doc: match.object,
    isNew: false,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }));

  assertEquals(onSavedDoc.callCount, 1);
  assert(onSavedDoc.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    doc: match.object,
    isNew: false,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }));
});

Deno.test("Operating on a document with a recognised operation id should only call fetch on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "50e02b33-b22c-4207-8785-5a8aa529ec84",
      operationName: "upgradeModel",
      operationParams: 2,
    }),
    { isUpdated: false },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ));

  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Operating on a document using a required version should cause required version to be passed to doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
      reqVersion: "aaaa",
    }),
    { isUpdated: true },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ));

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "cars",
    "_central",
    match.object,
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ));
});

Deno.test("Fail to operate on document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
      reqVersion: "bbbb", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then versionNotAvailable error is raised
    });
  }, SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to operate on document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
      // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is NOT specified then conflictOnSave error is raised
    });
  }, SengiConflictOnSaveError);
});

Deno.test("Fail to operate on document using an unknown operation.", async () => {
  const { sengi } = createSengiForTest();

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "a2c9bec0-ab03-4ded-bce6-d8a91f71e1d4",
      operationName: "unknownOperation",
      operationParams: {},
    });
  }, SengiUnrecognisedOperationNameError);
});

Deno.test("Fail to operate on document if it does not exist.", async () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    fetch: async () => ({ doc: null }),
  });

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
  }, SengiDocNotFoundError);
});

Deno.test("Fail to invoke an operation if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to invoke an operation if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
  }, SengiUnrecognisedApiKeyError);
});
