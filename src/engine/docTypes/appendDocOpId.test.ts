import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { appendDocOpId } from "./appendDocOpId.ts";

Deno.test("Append operation id for doc with no historical doc op ids.", () => {
  const doc: Partial<DocBase> = {};
  appendDocOpId(doc, "abc", 3);
  assertEquals(doc.docOpIds, ["abc"]);
});

Deno.test("Append operation id at the limit of doc ops with an explicitly set max-ops value.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc"],
  };
  appendDocOpId(doc, "ddd", 3);
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd"]);
});

Deno.test("Append operation id at the limit of doc ops with a policy but no explicitly defined max-ops value.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  appendDocOpId(doc, "fff");
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd", "eee", "fff"]);
});

Deno.test("Append operation id at the limit of doc ops with a default max-ops policy of 5.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  appendDocOpId(doc, "fff");
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd", "eee", "fff"]);
});
