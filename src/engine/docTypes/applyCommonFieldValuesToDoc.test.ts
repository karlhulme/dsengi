import { assertEquals } from "../../../deps.ts";
import { DocRecord } from "../../interfaces/index.ts";
import { applyCommonFieldValuesToDoc } from "./applyCommonFieldValuesToDoc.ts";

Deno.test("The creation properties are set if not already populated.", () => {
  const doc: DocRecord = {};
  applyCommonFieldValuesToDoc(doc, 5678, "aUser");
  assertEquals(doc.docOpIds, []);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docCreatedByUserId, "aUser");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
});

Deno.test("The creation properties are ignored if already set, and just lastUpdated properties are added.", () => {
  const doc: DocRecord = {
    docOpIds: ["abcd"],
    docCreatedMillisecondsSinceEpoch: 1111,
    docCreatedByUserId: "originalUser",
  };
  applyCommonFieldValuesToDoc(doc, 5678, "aUser");
  assertEquals(doc.docOpIds, ["abcd"]);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 1111);
  assertEquals(doc.docCreatedByUserId, "originalUser");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
});

Deno.test("The lastUpdated properties are updated with new values.", () => {
  const doc: DocRecord = {
    docCreatedMillisecondsSinceEpoch: 1111,
    docCreatedByUserId: "originalUser",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anotherUser",
  };
  applyCommonFieldValuesToDoc(doc, 5678, "aUser");
  assertEquals(doc.docOpIds, []);
  assertEquals(doc.docCreatedMillisecondsSinceEpoch, 1111);
  assertEquals(doc.docCreatedByUserId, "originalUser");
  assertEquals(doc.docLastUpdatedMillisecondsSinceEpoch, 5678);
  assertEquals(doc.docLastUpdatedByUserId, "aUser");
});
