// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
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

  const result = await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "00000000-0000-0000-0000-111122223333",
  });

  assertEquals(result.isDeleted, true);

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

  const result = await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    operationId: "00000000-0000-0000-0000-111122223333",
  });

  assertEquals(result.isDeleted, false);

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

Deno.test("Return a change doc when deleting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "change") {
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
  }, {
    trackChanges: true,
  });

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.deleteDocument({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(spyUpsert.callCount, 1);

  assertEquals(result.change?.action, "delete");
  assertEquals(result.change?.docId, "06151119-065a-4691-a7c8-2d84ec746ba9");
  assertEquals(result.change?.fields, {
    manufacturer: "ford",
    model: "ka",
  });
});

Deno.test("Return a pre-saved change when deleting a document.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (docTypeName: string, _partition: string, _id: string) => {
        if (docTypeName === "change") {
          return {
            doc: {
              digest: "abcd",
              action: "delete",
              fields: {
                manufacturer: "ford-original",
              },
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
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.deleteDocument({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(result.change?.action, "delete");
  assertEquals(result.change?.fields, {
    manufacturer: "ford-original",
  });

  // No upserting required because event was loaded rather than written
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Cannot return a change doc when deleting a previously deleted document if there is no pre-saved event.", async () => {
  const { sengi, docStore } = createSengiWithMockStore(
    {
      fetch: async (_docTypeName: string, _partition: string, _id: string) => {
        return {
          doc: null,
        };
      },
      deleteById: async () => ({
        code: DocStoreDeleteByIdResultCode.NOT_FOUND,
      }),
      upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
    },
    {},
    {
      trackChanges: true,
    },
  );

  const spyUpsert = spy(docStore, "upsert");

  const result = await sengi.deleteDocument({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  // No upserting because event cannot be created for previously deleted document.
  assertEquals(spyUpsert.callCount, 0);

  assertEquals(result.change, null);
});
