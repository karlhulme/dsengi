// deno-lint-ignore-file require-await
import { assert, assertEquals, assertThrows, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiCtorParamsValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Creating a document with a constructor should call exists and then upsert on doc store.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
    }),
    { isNew: true },
  );

  assertEquals(spyExists.callCount, 1);
  assert(
    spyExists.calledWithExactly(
      "car",
      "cars",
      "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      { custom: "prop" },
      {},
    ),
  );

  const resultDoc = {
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    docType: "car",
    docOpIds: [],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,

    // fields
    manufacturer: "tesla",
    model: "T",
    registration: "HG12 3AB",
  };

  assertEquals(spyUpsert.callCount, 1);
  assert(
    spyUpsert.calledWithExactly(
      "car",
      "cars",
      resultDoc,
      { custom: "prop" },
      {},
    ),
  );
});

Deno.test("Creating a document using the getMillisecondsSinceEpoch and getIdFromUser default implementations.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    getMillisecondsSinceEpoch: null,
    getIdFromUser: null,
  });

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: "HG12 3AB",
  })).resolves.toEqual({ isNew: true });

  const resultDoc = {
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    docType: "car",
    docOpIds: [],
    docCreatedByUserId: "<unknown>",
    docCreatedMillisecondsSinceEpoch: expect.any(Number),
    docLastUpdatedByUserId: "<unknown>",
    docLastUpdatedMillisecondsSinceEpoch: expect.any(Number),

    // fields
    manufacturer: "tesla",
    model: "T",
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

Deno.test("Creating a document with a constructor should cause the onPreSaveDoc and onSavedDoc events to be invoked.", async () => {
  const { sengi, sengiCtorOverrides } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onPreSaveDoc: jest.fn(),
    onSavedDoc: jest.fn(),
  });

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: "HG12 3AB",
  })).resolves.toEqual({ isNew: true });

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
    doc: expect.objectContaining({
      manufacturer: "tesla",
      model: "T",
      registration: "HG12 3AB",
    }),
    isNew: true,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });

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
    doc: expect.objectContaining({
      manufacturer: "tesla",
      model: "T",
      registration: "HG12 3AB",
    }),
    isNew: true,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });
});

Deno.test("Creating a document with a constructor that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: true }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: "HG12 3AB",
  })).resolves.toEqual({ isNew: false });

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty("mock.calls.length", 0);
});

Deno.test("Fail to create a document using a constructor where the constructor params do not pass validation.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  const spyExists = spy(docStore, "exists");

  await expect(sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: 123, // should be a string
  })).rejects.toThrow(asError(SengiCtorParamsValidationFailedError));

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
});

Deno.test("Fail to create a document using a constructor where the resulting doc does not pass validation.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  const spyExists = spy(docStore, "exists");

  await expect(sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: "HZ12 3AB",
  })).rejects.toThrow(asError(SengiValidateDocFailedError));

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
});

Deno.test("Fail to create document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiInsufficientPermissionsError);
  }
});

Deno.test("Fail to create document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedApiKeyError);
  }
});
