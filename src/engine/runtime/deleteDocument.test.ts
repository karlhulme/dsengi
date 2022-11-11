// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertObjectMatch,
  assertRejects,
  spy,
} from "../../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createDoc = () => ({
  id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  docType: "car",
  docStatus: "active",
  docVersion: "aaaa",
  docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
  docDigests: [
    "9999:A0:6ac951d1db683edc4a3bde31842608f45919b6b4",
  ],
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
});

Deno.test("Delete document by id should call delete on doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
  });

  const spyDeleteById = spy(docStore, "deleteById");

  assertEquals(
    await sengi.deleteDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "00000000-0000-0000-0000-111122223333",
    }),
    { isDeleted: true },
  );

  assertEquals(spyDeleteById.callCount, 1);
  assert(
    spyDeleteById.calledWith(
      "car",
      "_central",
      "06151119-065a-4691-a7c8-2d84ec746ba9",
      { custom: "prop" },
    ),
  );
});

Deno.test("Deleting a non-existing document is not an error but the lack of deletion is reported.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.NOT_FOUND }),
  });

  const spyDeleteById = spy(docStore, "deleteById");

  assertEquals(
    await sengi.deleteDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "00000000-0000-0000-0000-111122223333",
    }),
    { isDeleted: false },
  );

  assertEquals(spyDeleteById.callCount, 1);
});

Deno.test("Fail to delete document if disallowed by policy.", async () => {
  const { carDocType, sengi } = createSengiWithMockStore();

  if (carDocType.policy) {
    carDocType.policy.canDeleteDocuments = false;
  }

  await assertRejects(() =>
    sengi.deleteDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      operationId: "00000000-0000-0000-0000-111122223333",
    }), SengiActionForbiddenByPolicyError);
});

Deno.test("Raise an event when deleting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "changeEvent") {
        return {
          doc: null,
        };
      } else {
        return {
          doc: createDoc(),
        };
      }
    },
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: async () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.deleteDocument({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(spyUpsert.callCount, 1);

  assertEquals(spyUpsert.args[0][0], "changeEvent");
  assertEquals(spyUpsert.args[0][1], "_central");
  assertObjectMatch(spyUpsert.args[0][2], {
    action: "delete",
    changeUserId: "user-0001",
    digest: "3333:D0:06d677323d21d814a57abb60e220d13f1cbf7d46",
    subjectId: "06151119-065a-4691-a7c8-2d84ec746ba9",
    subjectDocType: "car",
    subjectFields: {
      manufacturer: "ford",
    },
    subjectPatchFields: {},
    timestampInMilliseconds: 1629881470000,
  });
});

Deno.test("Raise a pre-saved event when deleting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "changeEvent") {
        return {
          doc: {
            digest: "abcd",
            action: "delete",
            preChangeFields: {
              manufacturer: "ford",
            },
            subjectDocType: "car",
            timestampInMilliseconds: 1629881000000,
          },
        };
      } else {
        return {
          doc: createDoc(),
        };
      }
    },
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: async () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.deleteDocument({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    raiseChangeEventPartition: "diffPartition",
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  // No upserting required because event was loaded rather than written
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Cannot raise an event when deleting a previously deleted document if there is no pre-saved event.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (_docTypeName: string, _partition: string, _id: string) => {
      return {
        doc: null,
      };
    },
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.NOT_FOUND }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: async () => {},
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.deleteDocument({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    raiseChangeEventPartition: "diffPartition",
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  // No upserting because event cannot be created for previously deleted document.
  assertEquals(spyUpsert.callCount, 0);
});
