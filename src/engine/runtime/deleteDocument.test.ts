// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

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
