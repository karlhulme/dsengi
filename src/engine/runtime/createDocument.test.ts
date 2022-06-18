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
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

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

  assertEquals(
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    }),
    {
      isNew: true,
      doc: { id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1" },
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(
    spyFetch.calledWithExactly(
      "car",
      "cars",
      "_central",
      "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      { custom: "prop" },
      {},
    ),
  );

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

Deno.test("Creating a document using the default getMillisecondsSinceEpoch implementations.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    getMillisecondsSinceEpoch: null,
  });

  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    }),
    { isNew: true, doc: { id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1" } },
  );

  assertEquals(spyUpsert.callCount, 1);
});

Deno.test("Creating a document with a constructor should cause the onPreSaveDoc and onSavedDoc events to be invoked.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
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
    fieldNames: ["id"],
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
      id: "user-0001",
      claims: [],
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
      id: "user-0001",
      claims: [],
    },
  }));
});

Deno.test("Creating a document with a constructor that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      },
    }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    }),
    {
      isNew: false,
      doc: {
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      },
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to create a document using a constructor where the constructor params do not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: 123, // should be a string
      fieldNames: ["id"],
    });
  }, SengiCtorParamsValidationFailedError);
});

Deno.test("Fail to create a document using a constructor where the resulting doc does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HZ12 3AB",
      fieldNames: ["id"],
    });
  }, SengiDocValidationFailedError);
});

Deno.test("Fail to create document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  await assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    });
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to create document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  await assertRejects(async () => {
    await sengi.createDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      constructorName: "regTesla",
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    });
  }, SengiUnrecognisedApiKeyError);
});
