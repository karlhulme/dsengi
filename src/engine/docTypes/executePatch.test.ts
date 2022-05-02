import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocRecord,
  DocType,
  SengiPatchValidationFailedError,
} from "../../interfaces/index.ts";
import { executePatch } from "./executePatch.ts";

interface ExampleDoc extends DocBase {
  propA: string;
  propB: string;
  propC?: string;
  propD?: number;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    readOnlyFieldNames: ["propD"],
  };

  return docType;
}

Deno.test("A valid patch that changes a value is applied.", () => {
  const doc: DocRecord = { id: "123", propA: "aaa", propB: "bbb" };
  executePatch(createDocType(), doc, { propA: "AAA" });
  assertEquals(doc, { id: "123", propA: "AAA", propB: "bbb" });
});

Deno.test("A valid patch that removes a value is applied.", () => {
  const doc: DocRecord = {
    id: "123",
    propA: "aaa",
    propB: "bbb",
    propC: "ccc",
  };
  executePatch(createDocType(), doc, { propC: null });
  assertEquals(doc, { id: "123", propA: "aaa", propB: "bbb" });
});

Deno.test("A patch that attempts to change a system field is rejected.", () => {
  const doc: DocRecord = { id: "123", propA: "aaa", propB: "bbb" };
  assertThrows(
    () => executePatch(createDocType(), doc, { id: "321" }),
    SengiPatchValidationFailedError,
    "system field",
  );
});

Deno.test("A patch that attempts to change a readonly field is rejected.", () => {
  const doc: DocRecord = { id: "123", propA: "aaa", propB: "bbb" };
  assertThrows(
    () => executePatch(createDocType(), doc, { propD: -1 }),
    SengiPatchValidationFailedError,
    "read-only field",
  );
});
