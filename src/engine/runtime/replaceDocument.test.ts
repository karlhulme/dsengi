// deno-lint-ignore-file require-await
import { assert, assertEquals, assertThrowss, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiActionForbiddenByPolicyError,
  SengiDocValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createNewDocument = () => ({
  id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  docType: "car",
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
});

Deno.test("Replacing a document should call upsert on the doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.replaceDocument({
    ...defaultRequestProps,
    docTypeName: "car",
    doc: createNewDocument(),
  })).resolves.toEqual({ isNew: false });

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docOpIds: [],
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    resultDoc,
    { custom: "prop" },
    {},
  ]);
});

Deno.test("Replacing a document should raise the onPreSaveDoc and onSavedDoc delegates.", async () => {
  const { sengi, sengiCtorOverrides } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    onPreSaveDoc: () => {},
    onSavedDoc: () => {},
  });

  const spyOnPreSaveDoc = spy(sengiCtorOverrides, "onPreSaveDoc");
  const spyOnSavedDoc = spy(sengiCtorOverrides, "onSavedDoc");

  await expect(sengi.replaceDocument({
    ...defaultRequestProps,
    docTypeName: "car",
    doc: createNewDocument(),
  })).resolves.toEqual({ isNew: false });

  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty(
    "mock.calls.length",
    1,
  );
  expect(sengiCtorOverrides.onPreSaveDoc).toHaveProperty([
    "mock",
    "calls",
    "0",
    "0",
  ], {
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: expect.objectContaining({ name: "car" }),
    doc: expect.objectContaining({ model: "ka" }),
    isNew: null,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });

  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty("mock.calls.length", 1);
  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty([
    "mock",
    "calls",
    "0",
    "0",
  ], {
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: expect.objectContaining({ name: "car" }),
    doc: expect.objectContaining({ model: "ka" }),
    isNew: false,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });
});

Deno.test("Replacing a non-existent document should raise the onSavedDoc delegate.", async () => {
  const { sengi, docStore, sengiCtorOverrides } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onSavedDoc: () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.replaceDocument({
    ...defaultRequestProps,
    docTypeName: "car",
    doc: createNewDocument(),
  })).resolves.toEqual({ isNew: true });

  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty("mock.calls.length", 1);
  expect(sengiCtorOverrides.onSavedDoc).toHaveProperty([
    "mock",
    "calls",
    "0",
    "0",
  ], {
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: expect.objectContaining({ name: "car" }),
    doc: expect.objectContaining({ model: "ka" }),
    isNew: true,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docOpIds: [],
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  expect(docStore.upsert).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    resultDoc,
    { custom: "prop" },
    {},
  ]);
});

Deno.test("Fail to replace a document if it does not conform to the doc type schema.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument(),
        model: 123, // rather than a string
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiDocValidationFailedError);
  }
});

Deno.test("Fail to replace a document if it fails custom validation.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument(),
        registration: "HZ12 3AB", // registration must begin HG
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiValidateDocFailedError);
  }
});

Deno.test("Fail to replace a document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      doc: createNewDocument(),
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiInsufficientPermissionsError);
  }
});

Deno.test("Fail to replace a document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      doc: createNewDocument(),
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedApiKeyError);
  }
});

Deno.test("Fail to replace a document if disallowed by doc type policy.", async () => {
  const { carDocType, sengi } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  if (carDocType.policy) {
    carDocType.policy.canReplaceDocuments = false;
  }

  try {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
        docVersion: "aaaa",
        manufacturer: "Honda",
        model: "Accord",
        registration: "HG67 8HJ",
      },
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiActionForbiddenByPolicyError);
  }
});
