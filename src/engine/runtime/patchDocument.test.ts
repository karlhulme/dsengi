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
  SengiConflictOnSaveError,
  SengiDocNotFoundError,
  SengiDocValidationFailedError,
  SengiPatchValidationFailedError,
  SengiRequiredVersionNotAvailableError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTest = (
  upsertResponse?: DocStoreUpsertResult,
  sengiCtorOverrides?: Record<string, unknown>,
  options?: { storePatches?: boolean; trackChanges?: boolean },
) => {
  return createSengiWithMockStore(
    {
      fetch: async () => ({
        doc: {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          docType: "car",
          docStatus: "active",
          docVersion: "aaaa",
          docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
          docDigests: [],
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
      upsert: async () =>
        upsertResponse || ({ code: DocStoreUpsertResultCode.REPLACED }),
    },
    sengiCtorOverrides,
    options,
  );
};

Deno.test("Patching a document should call fetch and upsert on doc store, retaining existing properties (including unrecognised ones).", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docStatus: "active",
    docVersion: "1111-2222",
    docOpIds: [
      "50e02b33-b22c-4207-8785-5a8aa529ec84",
      "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    ],
    docDigests: [
      "11e7:P0:0d171dfe74e5c0f0738c8d5861973efea1750ebf",
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
    await sengi.patchDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
    }),
    {
      doc: resultDoc,
      change: null,
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
  ));

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "_central",
    resultDoc,
    "aaaa",
    { custom: "prop" },
  ));
});

Deno.test("Patches can be stored.", async () => {
  const { sengi, docStore } = createSengiForTest(undefined, undefined, {
    storePatches: true,
  });

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  await sengi.patchDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    patch: {
      model: "fiesta",
    },
  });

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
  ));

  // Two upserts, one for the patch, another for the changed doc.
  assertEquals(spyUpsert.callCount, 2);

  assert(spyUpsert.calledWith(
    "patch",
    "_central",
    {
      id: "90909",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      docType: "patch",
      patchedDocId: "06151119-065a-4691-a7c8-2d84ec746ba9",
      patchedDocType: "car",
      patch: { model: "fiesta" },
      docStatus: "active",
      docVersion: "1111-2222",
      docOpIds: [],
      docDigests: [],
      docCreatedMillisecondsSinceEpoch: 1629881470000,
      docCreatedByUserId: "user-0001",
      docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
      docLastUpdatedByUserId: "user-0001",
    },
    null,
    { custom: "patch-props" },
  ));
});

Deno.test("Patching a document using a required version should cause the required version to be passed to the doc store.", async () => {
  const { sengi, docStore } = createSengiForTest();

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.patchDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    reqVersion: "aaaa",
    patch: {
      model: "fiesta",
    },
  });

  assertEquals(result.doc.id, "06151119-065a-4691-a7c8-2d84ec746ba9");

  assertEquals(spyFetch.callCount, 1);

  assert(spyFetch.calledWith(
    "car",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
  ));

  assertEquals(spyUpsert.callCount, 1);

  assert(spyUpsert.calledWith(
    "car",
    "_central",
    match.object,
    "aaaa",
    { custom: "prop" },
  ));
});

Deno.test("Patching a document is an idempotent operation based on the digest on the doc.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
        docStatus: "active",
        docVersion: "aaaa",
        docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
        docDigests: ["11e7:P0:0d171dfe74e5c0f0738c8d5861973efea1750ebf"],
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      },
    }),
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.patchDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    reqVersion: "aaaa",
    patch: {
      model: "fiesta",
    },
  });

  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to patch document when required version is not available.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
    sessionToken: "",
  });

  await assertRejects(() =>
    sengi.patchDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
      reqVersion: "aaaa", // if upsert yields VERSION_NOT_AVAILABLE and reqVersion is specified then VersionNotAvailable error is raised
    }), SengiRequiredVersionNotAvailableError);
});

Deno.test("Fail to patch document if it changes between fetch and upsert.", async () => {
  const { sengi } = createSengiForTest({
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
    sessionToken: "",
  });

  await assertRejects(() =>
    sengi.patchDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
    }), SengiConflictOnSaveError);
});

Deno.test("Reject a patch to a non-existent doc.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(() =>
    sengi.patchDocument<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-aaaaaaaaaaaa",
      operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
      patch: {
        model: "fiesta",
      },
    }), SengiDocNotFoundError);
});

Deno.test("Reject a patch that would leave the document in an invalid state.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    () =>
      sengi.patchDocument<Car>({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          model: 123 as unknown as string,
        },
      }),
    SengiDocValidationFailedError,
    "model",
  );
});

Deno.test("Reject a patch that would change a system field.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    () =>
      sengi.patchDocument<Car>({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          id: "aaaaaaaa-065a-4691-a7c8-2d84ec746ba9",
        } as Partial<Car>,
      }),
    SengiPatchValidationFailedError,
    "system field",
  );
});

Deno.test("Reject a patch that produces a doc that fails the docType validate function.", async () => {
  const { sengi } = createSengiForTest();

  await assertRejects(
    () =>
      sengi.patchDocument<Car>({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
        patch: {
          registration: "HZ12 3AB",
        },
      }),
    SengiDocValidationFailedError,
    "Unrecognised vehicle registration prefix",
  );
});

Deno.test("Return a change doc when patching a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (docTypeName: string, _partition: string, _id: string) => {
        if (docTypeName === "change") {
          return {
            doc: null,
          };
        } else {
          return {
            doc: {
              id: "06151119-065a-4691-a7c8-2d84ec746ba9",
              docType: "car",
              docStatus: "active",
              docVersion: "aaaa",
              docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
              docDigests: [],
              manufacturer: "ford",
              model: "ka",
              registration: "HG12 3AB",
            },
          };
        }
      },
      upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.patchDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    reqVersion: "aaaa",
    patch: {
      model: "focus",
    },
  });

  // Upsert the event first, and the patched document second.
  assertEquals(spyUpsert.callCount, 2);

  assertEquals(result.change?.action, "patch");
  assertEquals(result.change?.fields, {
    manufacturer: "ford",
    model: "ka",
  });
  assertEquals(result.change?.patchFields, {
    model: "focus",
  });
});

Deno.test("Raise a pre-saved change doc when patching a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (docTypeName: string, _partition: string, _id: string) => {
        if (docTypeName === "change") {
          return {
            doc: {
              digest: "abcd",
              action: "patch",
              fields: {
                manufacturer: "ford-original",
              },
              patchFields: {
                manufacturer: "ford-new",
              },
              subjectDocType: "car",
              timestampInMilliseconds: 1629881000000,
            },
          };
        } else {
          return {
            doc: {
              id: "06151119-065a-4691-a7c8-2d84ec746ba9",
              docType: "car",
              docStatus: "active",
              docVersion: "aaaa",
              docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
              docDigests: [],
              manufacturer: "ford",
              model: "ka",
              registration: "HG12 3AB",
            },
          };
        }
      },
      upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.patchDocument<Car>({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "3ba01b5c-1ff1-481f-92f1-43d2060e11e7",
    reqVersion: "aaaa",
    patch: {
      model: "focus",
    },
  });

  // 1 upsert, the patched document, but not the event
  assertEquals(spyUpsert.callCount, 1);

  assertEquals(result.change?.action, "patch");
  assertEquals(result.change?.fields, {
    manufacturer: "ford-original",
  });
  assertEquals(result.change?.patchFields, {
    manufacturer: "ford-new",
  });
});
