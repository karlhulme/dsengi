// deno-lint-ignore-file no-explicit-any
import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";
import { ensureDoc } from "./ensureDoc.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

const exampleDocType: DocType<
  ExampleDoc,
  unknown,
  unknown,
  unknown,
  unknown
> = {
  name: "test",
  pluralName: "tests",
};

function createDoc(): any {
  return {
    id: "1111",
    docType: "test",
    propA: "foo",
    docOpIds: [],
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  };
}

Deno.test("A valid doc is accepted.", () => {
  ensureDoc(exampleDocType, createDoc());
});

Deno.test("A doc without an id is rejected.", () => {
  const doc = createDoc();
  delete doc.id;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "id property",
  );
});

Deno.test("A doc with an invalid docType is rejected.", () => {
  const doc = createDoc();
  doc.docType = "invalid";
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "must have docType",
  );
});

Deno.test("A doc with an invalid docOpIds array is rejected.", () => {
  const doc = createDoc();
  delete doc.docOpIds;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "docOpIds property",
  );
});

Deno.test("A doc with an invalid docCreatedMillisecondsSinceEpoch property is rejected.", () => {
  const doc = createDoc();
  delete doc.docCreatedMillisecondsSinceEpoch;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "docCreatedMillisecondsSinceEpoch property",
  );
});

Deno.test("A doc with an invalid docCreatedByUserId property is rejected.", () => {
  const doc = createDoc();
  delete doc.docCreatedByUserId;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "docCreatedByUserId property",
  );
});

Deno.test("A doc with an invalid docLastUpdatedMillisecondsSinceEpoch property is rejected.", () => {
  const doc = createDoc();
  delete doc.docLastUpdatedMillisecondsSinceEpoch;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "docLastUpdatedMillisecondsSinceEpoch property",
  );
});

Deno.test("A doc with an invalid docLastUpdatedByUserId property is rejected.", () => {
  const doc = createDoc();
  delete doc.docLastUpdatedByUserId;
  assertThrows(
    () => ensureDoc(exampleDocType, doc),
    SengiDocValidationFailedError,
    "docLastUpdatedByUserId property",
  );
});
