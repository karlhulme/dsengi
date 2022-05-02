import { assert, assertEquals, assertThrows, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
  SengiAuthorisationFailedError,
  SengiConflictOnSaveError,
  SengiDocNotFoundError,
  SengiDocValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiPatchValidationFailedError,
  SengiRequiredVersionNotAvailableError,
  SengiUnrecognisedApiKeyError,
  SengiValidateDocFailedError,
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
      upsertResponse || ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, sengiCtorOverrides);
};

Deno.test("Patching a document should call fetch and upsert on doc store, retaining existing properties (including unrecognised ones).", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      model: "fiesta",
    },
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
      "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    ],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    manufacturer: "ford",
    model: "fiesta",
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

Deno.test("Patching a document should invoke the onPreSaveDoc and onUpdateDoc delegates.", async () => {
  const { sengi, sengiCtorOverrides } = createSengiForTest(undefined, {
    onPreSaveDoc: () => {},
    onSavedDoc: () => {},
  });

  const spyOnPreSaveDoc = spy(sengiCtorOverrides, "onPreSaveDoc");
  const spyOnSavedDoc = spy(sengiCtorOverrides, "onSavedDoc");

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      model: "fiesta",
    },
  })).resolves.toEqual({ isUpdated: true });

  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty(
    "mock.calls.length",
    1,
  );
  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty(
    ["mock", "calls", "0", "0"],
    expect.objectContaining({
      clientName: "admin",
      reqProps: { foo: "bar" },
      docType: expect.objectContaining({ name: "car" }),
      doc: expect.objectContaining({ model: "fiesta" }),
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
      reqProps: { foo: "bar" },
      docType: expect.objectContaining({ name: "car" }),
      doc: expect.objectContaining({ model: "fiesta" }),
      user: {
        userId: "user-0001",
        username: "testUser",
      },
    }),
  );
});

Deno.test("Patching a document with a known operation id should only call fetch on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "50e02b33-b22c-4207-8785-5a8aa529ec84",
    patch: {
      model: "fiesta",
    },
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

Deno.test("Patching a document using a required version should cause the required version to be passed to the doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    reqVersion: "aaaa",
    patch: {
      model: "fiesta",
    },
  })).resolves.toEqual({ isUpdated: true });

  expect(docStore.fetch).toHaveProperty("mock.calls.length", 1);
  expect(docStore.fetch).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ]);

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    expect.anything(),
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ]);
});

Deno.test("Fail to patch document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      model: "fiesta",
    },
    reqVersion: "aaaa", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then versionNotAvailable error is raised
  })).rejects.toThrow(SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to patch document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      model: "fiesta",
    },
    // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is NOT specified then conflictOnSave error is raised
  })).rejects.toThrow(SengiConflictOnSaveError);
});

Deno.test("Reject a patch to a non-existent doc.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiDocNotFoundError);
  }
});

Deno.test("Accept a patch to an unrecognised field if the json schema allows additional properties.", async () => {
  const { carDocType, sengi } = createSengiForTest();

  carDocType.jsonSchema.additionalProperties = true;

  await expect(sengi.patchDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      madeup: "value",
    },
  })).resolves.toEqual({ isUpdated: true });
});

Deno.test("Reject a patch to any field that is not explicitly allowed for patching.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        manufacturer: "tesla",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiPatchValidationFailedError);
    expect(JSON.stringify(err)).toContain("Cannot patch readonly field");
  }
});

Deno.test("Reject a patch with a field value that is given an invalid type.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: 123,
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiDocValidationFailedError);
    expect(JSON.stringify(err)).toContain("model");
    expect(JSON.stringify(err)).toContain("should be string");
  }
});

Deno.test("Reject a patch that would change a system field.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        id: "aaaaaaaa-065a-4691-a7c8-2d84ec746ba9",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiPatchValidationFailedError);
    expect(JSON.stringify(err)).toContain("system field");
  }
});

Deno.test("Reject a patch that produces a doc that fails the docType validate function.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        registration: "HZ12 3AB",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiValidateDocFailedError);
    expect((err as SengiValidateDocFailedError).message).toContain(
      "Unrecognised vehicle registration prefix",
    );
  }
});

Deno.test("Fail to patch a document if permissions insufficient.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "ka",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiInsufficientPermissionsError);
  }
});

Deno.test("Fail to patch a document if client api key is not recognised.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "ka",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedApiKeyError);
  }
});

Deno.test("Fail to patch with a field that is protected by authorisation.", async () => {
  const { sengi } = createSengiForTest();

  try {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        engineCode: "a1231bb",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiAuthorisationFailedError);
  }
});
