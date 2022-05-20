// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  SengiActionForbiddenByPolicyError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Delete document by id should call delete on doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
      },
    }),
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyDeleteById = spy(docStore, "deleteById");

  assertEquals(await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  }), { isDeleted: true })

  assertEquals(spyFetch.callCount, 1);
  assert(
    spyFetch.calledWith(
      "car",
      "cars",
      "_central",
      "06151119-065a-4691-a7c8-2d84ec746ba9",
      { custom: "prop" },
      {},
      ),
  );

  assertEquals(spyDeleteById.callCount, 1);
  assert(
    spyDeleteById.calledWith(
      "car",
      "cars",
      "_central",
      "06151119-065a-4691-a7c8-2d84ec746ba9",
      { custom: "prop" },
      {},
    )
  );
});

Deno.test("Delete document by id should raise callbacks.", async () => {
  const onDeletedDoc = spy((..._args: unknown[]) => {});

  const { sengi, carDocType } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
      },
    }),
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
  }, {
    onDeletedDoc,
  });

  assertEquals(await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  }), { isDeleted: true });

  assertEquals(onDeletedDoc.callCount, 1)
  assert(onDeletedDoc.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }))
});

Deno.test("Deleting a non-existing document is not an error but the lack of deletion is reported.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async () => ({
      doc: null,
    }),
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.NOT_FOUND }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyDeleteById = spy(docStore, "deleteById");

  assertEquals(await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  }), { isDeleted: false });

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {}
  ))

  assertEquals(spyDeleteById.callCount, 0);
});

Deno.test("Deleting a non-existing document is not an error but the lack of deletion is reported, even if the document is deleted between retrieval and instruction.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
      },
    }),
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.NOT_FOUND }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyDeleteById = spy(docStore, "deleteById");

  assertEquals(await sengi.deleteDocument({
    ...defaultRequestProps,
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  }), { isDeleted: false });

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ))

  assertEquals(spyDeleteById.callCount, 1);
  assert(spyDeleteById.calledWith(
    "car",
    "cars",
    "_central",
    "06151119-065a-4691-a7c8-2d84ec746ba9",
    { custom: "prop" },
    {},
  ))
});

Deno.test("Fail to delete document if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.deleteDocument({
      ...defaultRequestProps,
      apiKey: "noneKey",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    });
  }, SengiInsufficientPermissionsError)
});

Deno.test("Fail to delete document if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.deleteDocument({
      ...defaultRequestProps,
      apiKey: "unknown",
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    });
    throw new Error("fail");
  }, SengiUnrecognisedApiKeyError)
});

Deno.test("Fail to delete document if disallowed by policy.", async () => {
  const { carDocType, sengi } = createSengiWithMockStore();

  if (carDocType.policy) {
    carDocType.policy.canDeleteDocuments = false;
  }

  assertRejects(async () => {
    await sengi.deleteDocument({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    });
    throw new Error("fail");
  }, SengiActionForbiddenByPolicyError)
});
