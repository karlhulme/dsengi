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
  SengiCtorParamsValidationFailedError,
  SengiDocValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
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
      "_central",
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
      "_central",
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

  assertEquals(spyUpsert.callCount, 1);
});

Deno.test("Creating a document with a constructor should cause the onPreSaveDoc and onSavedDoc events to be invoked.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onPreSaveDoc,
    onSavedDoc,
  });

  await sengi.createDocument({
    ...defaultRequestProps,
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    constructorName: "regTesla",
    constructorParams: "HG12 3AB",
  });

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

Deno.test("Creating a document with a constructor that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    exists: async () => ({ found: true }),
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
    { isNew: false },
  );

  assertEquals(spyExists.callCount, 1);
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to create a document using a constructor where the constructor params do not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: 123, // should be a string
    });
  }, SengiCtorParamsValidationFailedError);
});

Deno.test("Fail to create a document using a constructor where the resulting doc does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  });

  assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HZ12 3AB",
    });
  }, SengiDocValidationFailedError);
});

Deno.test("Fail to create document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
    });
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to create document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
    });
  }, SengiUnrecognisedApiKeyError);
});
