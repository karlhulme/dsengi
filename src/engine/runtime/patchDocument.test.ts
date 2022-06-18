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
  SengiAuthorisationFailedError,
  SengiConflictOnSaveError,
  SengiDocNotFoundError,
  SengiDocValidationFailedError,
  SengiInsufficientPermissionsError,
  SengiPatchValidationFailedError,
  SengiRequiredVersionNotAvailableError,
  SengiUnrecognisedApiKeyError,
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

  assertEquals(
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    }),
    {
      isUpdated: true,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
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
    resultDoc,
    { custom: "prop" },
    { reqVersion: "aaaa" },
  ));
});

Deno.test("Patching a document should invoke the onPreSaveDoc and onUpdateDoc delegates.", async () => {
  const onPreSaveDoc = spy((..._args: unknown[]) => {});
  const onSavedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiForTest(undefined, {
    onPreSaveDoc,
    onSavedDoc,
  });

  assertEquals(
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    }),
    {
      isUpdated: true,
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
    isNew: false,
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
    isNew: false,
    user: {
      id: "user-0001",
      claims: [],
    },
  }));
});

Deno.test("Patching a document with a known operation id should only call fetch on doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "50e02b33-b22c-4207-8785-5a8aa529ec84",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    }),
    {
      isUpdated: false,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
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

Deno.test("Patching a document using a required version should cause the required version to be passed to the doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      reqVersion: "aaaa",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    }),
    {
      isUpdated: true,
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      },
    },
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

Deno.test("Fail to patch document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      reqVersion: "aaaa", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then VersionNotAvailable error is raised
      fieldNames: ["id"],
    });
  }, SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to patch document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    }); // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is NOT specified then conflictOnSave error is raised
  }, SengiConflictOnSaveError);
});

Deno.test("Reject a patch to a non-existent doc.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      fieldNames: ["id"],
    });
  }, SengiDocNotFoundError);
});

Deno.test("Reject a patch to any field that is marked as readonly.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    async () => {
      await sengi.patchDocument({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          manufacturer: "tesla",
        },
        fieldNames: ["id"],
      });
    },
    SengiPatchValidationFailedError,
    "Cannot patch read-only field",
  );
});

Deno.test("Reject a patch with a field value that is given an invalid type.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    async () => {
      await sengi.patchDocument({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          model: 123,
        },
        fieldNames: ["id"],
      });
    },
    SengiDocValidationFailedError,
    "model",
  );
});

Deno.test("Reject a patch that would change a system field.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    async () => {
      await sengi.patchDocument({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          id: "aaaaaaaa-065a-4691-a7c8-2d84ec746ba9",
        },
        fieldNames: ["id"],
      });
    },
    SengiPatchValidationFailedError,
    "system field",
  );
});

Deno.test("Reject a patch that produces a doc that fails the docType validate function.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    async () => {
      await sengi.patchDocument({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          registration: "HZ12 3AB",
        },
        fieldNames: ["id"],
      });
    },
    SengiDocValidationFailedError,
    "Unrecognised vehicle registration prefix",
  );
});

Deno.test("Fail to patch a document if permissions insufficient.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "ka",
      },
      fieldNames: ["id"],
    });
  }, SengiInsufficientPermissionsError);
});

Deno.test("Fail to patch a document if client api key is not recognised.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "ka",
      },
      fieldNames: ["id"],
    });
  }, SengiUnrecognisedApiKeyError);
});

Deno.test("Fail to patch with a field that is protected by authorisation.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(async () => {
    await sengi.patchDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        engineCode: "a1231bb",
      },
      fieldNames: ["id"],
    });
  }, SengiAuthorisationFailedError);
});
