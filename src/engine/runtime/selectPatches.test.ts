// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import { createSengiWithMockStore } from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    selectAll: async () => ({
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

  const spySelectAll = spy(docStore, "selectAll");

  assertEquals(
    await sengi.selectPatches({
      documentId: "ffffffff-0000-0000-0000-000000000000",
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

  assertEquals(spySelectAll.callCount, 1);

  assert(
    spySelectAll.calledWith(
      "patch",
      "ffffffff-0000-0000-0000-000000000000",
      false,
      { custom: "patch-props" },
    ),
  );
});
