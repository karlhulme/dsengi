// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertRejects,
  match,
  spy,
} from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiDocValidationFailedError,
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

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    }),
    { isNew: true },
  );

  assertEquals(spyExists.callCount, 1);
  assert(spyExists.calledWith(
    "car",
    "cars",
    "_central",
    "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    { custom: "prop" },
    {},
  ));

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

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "cars",
    "_central",
    resultDoc,
    { custom: "prop" },
    {},
  ));
});

Deno.test("Adding a new document should cause the onPreSaveDoc and onSavedDoc events to be invoked.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onPreSaveDoc,
    onSavedDoc,
  });

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    }),
    { isNew: true },
  );

  assertEquals(onPreSaveDoc.callCount, 1);
  assert(onPreSaveDoc.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    doc: match.object,
    isNew: true,
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
    isNew: true,
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }));
});

Deno.test("Adding a new document that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: true }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyExists = spy(docStore, "exists");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    }),
    { isNew: false },
  );

  assertEquals(spyExists.callCount, 1);
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to add a new document that does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  assertRejects(async () => {
    await sengi.newDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: { ...newCar, registration: "HZ12 3AB" },
    });
  }, SengiDocValidationFailedError);
});

Deno.test("Fail to add a new document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.newDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    });
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to add a new document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.newDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    });
  }, SengiUnrecognisedApiKeyError);
});
