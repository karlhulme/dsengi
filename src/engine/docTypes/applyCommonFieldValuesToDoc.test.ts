import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { applyCommonFieldValuesToDoc } from "./applyCommonFieldValuesToDoc.ts";

function createDoc(): DocBase {
  return {
    id: "123",
    docType: "test",
    docOpIds: ["abcd"],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  };
}

Deno.test("The creation properties are set if not already populated.", () => {
  const doc = {} as unknown as DocBase;
  applyCommonFieldValuesToDoc(doc, 5678, "aUser");
  assertEquals(doc.docOpIds, []);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docCreatedByUserId, "aUser");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
});

Deno.test("The creation properties are ignored if already set, and just lastUpdated properties are added.", () => {
  const doc = createDoc();
  applyCommonFieldValuesToDoc(doc, 5678, "aUser");
  assertEquals(doc.docOpIds, ["abcd"]);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 1234);
  assertEquals(doc.docCreatedByUserId, "anon");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
});
