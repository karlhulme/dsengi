import { assert, assertEquals, assertThrows, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiDocTypeValidateFunctionError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const newCar = {
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Adding a new document should call exists and then upsert on doc store.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyExists = spy(docStore, "exist");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.newDocument({
    ...defaultRequestProps,
    docTypeName: "car",
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    doc: newCar,
  })).resolves.toEqual({ isNew: true });

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
  expect(docStore.exists).toHaveProperty(["mock", "calls", "0"], [
    "car",
    "cars",
    "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    { custom: "prop" },
    {},
  ]);

  const resultDoc = {
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    docType: "car",
    docOpIds: [],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,

    // fields
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

Deno.test("Adding a new document should cause the onPreSaveDoc and onSavedDoc events to be invoked.", async () => {
  const { sengi, sengiCtorOverrides } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onPreSaveDoc: () => {},
    onSavedDoc: () => {},
  });

  const spyExists = spy(docStore, "exist");
  const spyUpsert = spy(docStore, "upsert");
  const spyOnPreSaveDoc = spy(sengiCtorOverrides, "onPreSaveDoc");
  const spyOnSavedDoc = spy(sengiCtorOverrides, "onSavedDoc");

  await expect(sengi.newDocument({
    ...defaultRequestProps,
    docTypeName: "car",
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    doc: newCar,
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
      manufacturer: "ford",
      model: "ka",
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
      manufacturer: "ford",
      model: "ka",
      registration: "HG12 3AB",
    }),
    isNew: true,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  });
});

Deno.test("Adding a new document that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: true }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyExists = spy(docStore, "exist");
  const spyUpsert = spy(docStore, "upsert");

  await expect(sengi.newDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    doc: newCar,
  })).resolves.toEqual({ isNew: false });

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
  expect(docStore.upsert).toHaveProperty("mock.calls.length", 0);
});

Deno.test("Fail to add a new document that does not pass validation.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  const spyExists = spy(docStore, "exist");

  await expect(sengi.newDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    doc: { ...newCar, registration: "HZ12 3AB" },
  })).rejects.toThrow(asError(SengiDocTypeValidateFunctionError));

  expect(docStore.exists).toHaveProperty("mock.calls.length", 1);
});

Deno.test("Fail to add a new document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.newDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiInsufficientPermissionsError);
  }
});

Deno.test("Fail to add a new document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  try {
    await sengi.newDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    });
    throw new Error("fail");
  } catch (err) {
    expect(err).toBeInstanceOf(SengiUnrecognisedApiKeyError);
  }
});
