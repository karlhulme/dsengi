// deno-lint-ignore-file require-await
import { assert, assertEquals, assertThrows, spy } from "../../../deps.ts";
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

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    operationName: "upgradeModel",
    operationParams: 2,
  })).resolves.toEqual({ isUpdated: true });

  expect(docStore.fetch).toHaveProperty("mock.calls.length", 1);
  expect(docStore.fetch).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ]);

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

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    resultDoc,
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ]);
});

Deno.test("Operating on a document should raise callbacks.", async () => {
  const { sengi, sengiCtorOverrides } = createSengiForTest(undefined, {
    onPreSaveDoc: () => {},
    onSavedDoc: () => {},
  });

  const spyOnPreSaveDoc = spy(sengiCtorOverrides, "onPreSaveDoc");
  const spyOnSavedDoc = spy(sengiCtorOverrides, "onSavedDoc");

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    operationName: "upgradeModel",
    operationParams: 2,
  })).resolves.toEqual({ isUpdated: true });

  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty(
    "mock.calls.length",
    1,
  );
  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty(
    ["mock", "calls", "0", "0"],
    expect.objectContaining({
      clientName: "admin",
      docStoreOptions: { custom: "prop" },
      reqProps: { foo: "bar" },
      docType: expect.objectContaining({ name: "car" }),
      doc: expect.objectContaining({ model: "ka2" }),
      isNew: false,
      user: {
        userId: "user-0001",
        username: "testUser",
      },
    }),
  );

  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty("mock.calls.length", 1);
  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty(
    ["mock", "calls", "0", "0"],
    expect.objectContaining({
      clientName: "admin",
      docStoreOptions: { custom: "prop" },
      reqProps: { foo: "bar" },
      docType: expect.objectContaining({ name: "car" }),
      doc: expect.objectContaining({ model: "ka2" }),
      isNew: false,
      user: {
        userId: "user-0001",
        username: "testUser",
      },
    }),
  );
});

Deno.test("Operating on a document with a recognised operation id should only call fetch on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "50e02b33-b22c-4207-8785-5a8aa529ec84",
    operationName: "upgradeModel",
    operationParams: 2,
  })).resolves.toEqual({ isUpdated: false });

  expect(docStore.fetch).toHaveProperty("mock.calls.length", 1);
  expect(docStore.fetch).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ]);

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 0);
});

Deno.test("Operating on a document using a required version should cause required version to be passed to doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    operationName: "upgradeModel",
    operationParams: 2,
    reqVersion: "aaaa",
  })).resolves.toEqual({ isUpdated: true });

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    expect.anything(),
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ]);
});

Deno.test("Fail to operate on document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    operationName: "upgradeModel",
    operationParams: 2,
    reqVersion: "bbbb", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then versionNotAvailable error is raised
  })).rejects.toThrow(SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to operate on document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await expect(sengi.operateOnDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
    operationName: "upgradeModel",
    operationParams: 2,
    // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is NOT specified then conflictOnSave error is raised
  })).rejects.toThrow(SengiConflictOnSaveError);
});

Deno.test("Fail to operate on document using an unknown operation.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "a2c9bec0-ab03-4ded-bce6-d8a91f71e1d4",
      operationName: "unknownOperation",
      operationParams: {},
    });
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedOperationNameError);
  }
});

Deno.test("Fail to operate on document if it does not exist.", async () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    fetch: async () => ({ doc: null }),
  });

  try {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiDocNotFoundError);
  }
});

Deno.test("Fail to invoke an operation if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiInsufficientPermissionsError);
  }
});

Deno.test("Fail to invoke an operation if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.operateOnDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "db93acbc-bc8a-4cf0-a5c9-ffaafcb54028",
      operationName: "upgradeModel",
      operationParams: 2,
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedApiKeyError);
  }
});
