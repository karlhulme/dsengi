// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import { createSengiWithMockStore } from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    selectByFilter: async () => ({
      docs: [{
        id: "00000000-0000-0000-0000-aaaa00000000",
        patchedDocId: "ffffffff-0000-0000-0000-000000000000",
        patchedDocType: "testDoc",
        docCreatedByUserId: "test_user",
        docCreatedMillisecondsSinceEpoch: 1629881470000,
        patch: {
          field1: "one",
          field2: "two",
        },
      }, {
        id: "00000000-0000-0000-0000-bbbb00000000",
        patchedDocId: "ffffffff-0000-0000-0000-000000000000",
        patchedDocType: "testDoc",
        docCreatedByUserId: "test_user",
        docCreatedMillisecondsSinceEpoch: 1629881470000,
        patch: {
          field3: "three",
        },
      }],
    }),
  }, sengiCtorOverrides);
};

Deno.test("Select all patches for a document.", async () => {
  const { sengi, docStore } = createSengiForTests();

  const spySelectByFilter = spy(docStore, "selectByFilter");

  assertEquals(
    await sengi.selectPatches({
      partition: "_central",
      documentId: "ffffffff-0000-0000-0000-000000000000",
      from: "first",
      limit: 20,
    }),
    {
      patches: [
        {
          docCreatedByUserId: "test_user",
          docCreatedMillisecondsSinceEpoch: 1629881470000,
          id: "00000000-0000-0000-0000-aaaa00000000",
          patch: {
            field1: "one",
            field2: "two",
          },
          patchedDocId: "ffffffff-0000-0000-0000-000000000000",
          patchedDocType: "testDoc",
        },
        {
          docCreatedByUserId: "test_user",
          docCreatedMillisecondsSinceEpoch: 1629881470000,
          id: "00000000-0000-0000-0000-bbbb00000000",
          patch: {
            field3: "three",
          },
          patchedDocId: "ffffffff-0000-0000-0000-000000000000",
          patchedDocType: "testDoc",
        },
      ],
    },
  );

  assertEquals(spySelectByFilter.callCount, 1);

  assert(
    spySelectByFilter.calledWith(
      "patch",
      "_central",
      "_central ffffffff-0000-0000-0000-000000000000 first 20",
      false,
      { custom: "patch-props" },
    ),
  );
});
