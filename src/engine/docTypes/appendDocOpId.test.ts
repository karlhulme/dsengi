import { assertEquals } from "../../../deps.ts";
import { DocBase, DocType } from "../../interfaces/index.ts";
import { appendDocOpId } from "./appendDocOpId.ts";

function createDocType(): DocType {
  return {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    validatePatch: () => {},
    policy: {
      maxOpIds: 3,
    },
  };
}

Deno.test("Append operation id for doc with no historical doc op ids.", () => {
  const doc: Partial<DocBase> = {};
  appendDocOpId(createDocType(), doc, "abc");
  assertEquals(doc.docOpIds, ["abc"]);
});

Deno.test("Append operation id at the limit of doc ops with an explicitly set max-ops value.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc"],
  };
  appendDocOpId(createDocType(), doc, "ddd");
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd"]);
});

Deno.test("Append operation id at the limit of doc ops with a policy but no explicitly defined max-ops value.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  const docType = createDocType();
  if (docType.policy) {
    delete docType.policy.maxOpIds;
  }

  appendDocOpId(docType, doc, "fff");
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd", "eee", "fff"]);
});

Deno.test("Append operation id at the limit of doc ops with a default max-ops policy of 5.", () => {
  const doc: Partial<DocBase> = {
    docOpIds: ["aaa", "bbb", "ccc", "ddd", "eee"],
  };

  const docType = createDocType();
  delete docType.policy;

  appendDocOpId(docType, doc, "fff");
  assertEquals(doc.docOpIds, ["bbb", "ccc", "ddd", "eee", "fff"]);
});
