import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { isOpIdInDocument } from "./isOpIdInDocument.ts";

const doc: DocBase = {
  id: "123",
  docType: "test",
  docStatus: "active",
  docOpIds: ["aaa", "bbb"],
  docVersion: "1234",
  docCreatedMillisecondsSinceEpoch: 1234,
  docCreatedByUserId: "anon",
  docLastUpdatedMillisecondsSinceEpoch: 1234,
  docLastUpdatedByUserId: "anon",
};

Deno.test("Recognise existing op ids on a document.", () => {
  assertEquals(isOpIdInDocument(doc, "aaa"), true);
  assertEquals(isOpIdInDocument(doc, "bbb"), true);
});

Deno.test("Return false for op ids that are not recorded on a document.", () => {
  assertEquals(isOpIdInDocument(doc, "ccc"), false);
});

Deno.test("Return false if doc does not have a docOpIds array.", () => {
  assertEquals(isOpIdInDocument({}, "ccc"), false);
});
