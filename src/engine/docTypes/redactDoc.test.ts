import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { redactDoc } from "./redactDoc.ts";

interface ExampleDoc extends DocBase {
  propA: string;
  propB: string;
  propC?: number;
  propD?: number;
}

function createDoc(): ExampleDoc {
  return {
    propA: "sensitive",
    propB: "boring",
    propC: 1234,
  } as unknown as ExampleDoc;
}

Deno.test("Redact a document where fields are present.", () => {
  const doc = createDoc();

  redactDoc(
    doc,
    [{ fieldName: "propA", value: "-" }, { fieldName: "propC", value: 0 }],
    "REDACT-001",
  );

  assertEquals(doc, {
    propA: "-",
    propB: "boring",
    propC: 0,
  } as ExampleDoc);
});

Deno.test("Redact a document using the redact value.", () => {
  const doc = createDoc();

  redactDoc(doc, [{ fieldName: "propA", value: "*" }], "REDACT-001");

  assertEquals(doc, {
    propA: "REDACT-001",
    propB: "boring",
    propC: 1234,
  } as ExampleDoc);
});
