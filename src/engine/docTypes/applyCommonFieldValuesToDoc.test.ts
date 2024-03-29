import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { applyCommonFieldValuesToDoc } from "./applyCommonFieldValuesToDoc.ts";

function createDoc(): DocBase {
  return {
    id: "123",
    docType: "test",
    docStatus: "active",
    docOpIds: ["abcd"],
    docDigests: ["efgh"],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  };
}

Deno.test("The creation properties are set if not already populated.", () => {
  const doc = {} as unknown as DocBase;
  applyCommonFieldValuesToDoc(doc, 5678, "aUser", "new-doc-version");
  assertEquals(doc.docOpIds, []);
  assertEquals(doc.docDigests, []);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docCreatedByUserId, "aUser");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
  assertEquals(doc.docVersion, "new-doc-version");
});

Deno.test("The creation properties are ignored if already set, and just lastUpdated properties are added.", () => {
  const doc = createDoc();
  applyCommonFieldValuesToDoc(doc, 5678, "aUser", "new-doc-version");
  assertEquals(doc.docOpIds, ["abcd"]);
  assertEquals(doc.docDigests, ["efgh"]);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 1234);
  assertEquals(doc.docCreatedByUserId, "anon");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
  assertEquals(doc.docVersion, "new-doc-version");
});
