import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { appendDocDigest } from "./appendDocDigest.ts";

Deno.test("Append digest for doc with no historical keys.", () => {
  const doc: Partial<DocBase> = {};
  appendDocDigest(doc, "abc", 3);
  assertEquals(doc.docDigests, ["abc"]);
});

Deno.test("Append digest at the limit of doc keys with an explicitly set max-digests value.", () => {
  const doc: Partial<DocBase> = {
    docDigests: ["aaa", "bbb", "ccc"],
  };
  appendDocDigest(doc, "ddd", 3);
  assertEquals(doc.docDigests, ["bbb", "ccc", "ddd"]);
});

Deno.test("Append digest at the limit of doc ops with a policy but no explicitly defined max-digests value.", () => {
  const doc: Partial<DocBase> = {
    docDigests: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  appendDocDigest(doc, "fff");
  assertEquals(doc.docDigests, ["bbb", "ccc", "ddd", "eee", "fff"]);
});

Deno.test("Append digest at the limit of doc ops with a default max-digests policy of 5.", () => {
  const doc: Partial<DocBase> = {
    docDigests: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  appendDocDigest(doc, "fff");
  assertEquals(doc.docDigests, ["bbb", "ccc", "ddd", "eee", "fff"]);
});
