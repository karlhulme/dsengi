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
  SengiActionForbiddenByPolicyError,
  SengiDocValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createNewDocument = () => ({
  id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  docType: "car",
  docOpIds: [],
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
});

Deno.test("Replacing a document should call upsert on the doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  });

  const spyUpsert = spy(docStore, "upsert");

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

  assertEquals(
    await sengi.replaceDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      doc: createNewDocument(),
      fieldNames: ["id"],
    }),
    {
      isNew: false,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
  );

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

Deno.test("Replacing a document should raise the onPreSaveDoc and onSavedDoc delegates.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    onPreSaveDoc,
    onSavedDoc,
  });

  assertEquals(
    await sengi.replaceDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      doc: createNewDocument(),
      fieldNames: ["id"],
    }),
    {
      isNew: false,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
  );

  assertEquals(onPreSaveDoc.callCount, 1);

  assert(onPreSaveDoc.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    doc: match.object,
    isNew: null,
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

Deno.test("Replacing a non-existent document should raise the onSavedDoc delegate.", async () => {
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, docStore, carDocType } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onSavedDoc,
  });

  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.replaceDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      doc: createNewDocument(),
      fieldNames: ["id"],
    }),
    {
      isNew: true,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
  );

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

Deno.test("Fail to replace a document if it does not conform to the doc type schema.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument(),
        model: 123, // rather than a string
      },
      fieldNames: ["id"],
    });
  }, SengiDocValidationFailedError);
});

Deno.test("Fail to replace a document if it fails custom validation.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument(),
        registration: "HZ12 3AB", // registration must begin HG
      },
      fieldNames: ["id"],
    });
    throw new Error("fail");
  }, SengiDocValidationFailedError);
});

Deno.test("Fail to replace a document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      doc: createNewDocument(),
      fieldNames: ["id"],
    });
    throw new Error("fail");
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to replace a document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.replaceDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      doc: createNewDocument(),
      fieldNames: ["id"],
    });
    throw new Error("fail");
  }, SengiUnrecognisedApiKeyError);
});

Deno.test("Fail to replace a document if disallowed by doc type policy.", async () => {
  const { carDocType, sengi } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  if (carDocType.policy) {
    carDocType.policy.canReplaceDocuments = false;
  }

  assertRejects(async () => {
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
      fieldNames: ["id"],
    });
    throw new Error("fail");
  }, SengiActionForbiddenByPolicyError);
});
