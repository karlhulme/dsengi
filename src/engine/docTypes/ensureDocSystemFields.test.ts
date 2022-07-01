import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";
import { ensureDocSystemFields } from "./ensureDocSystemFields.ts";

function createDoc(): DocBase {
  return {
    id: "1111",
    docType: "test",
    docOpIds: [],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  };
}

Deno.test("A valid doc is accepted.", () => {
  ensureDocSystemFields("test", createDoc());
});

Deno.test("A doc without an id is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.id;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "id property",
  );
});

Deno.test("A doc with an invalid docType is rejected.", () => {
  const doc = createDoc();
  doc.docType = "invalid";
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "must have docType",
  );
});

Deno.test("A doc with an invalid docOpIds array is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.docOpIds;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "docOpIds property",
  );
});

Deno.test("A doc with an invalid docCreatedMillisecondsSinceEpoch property is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.docCreatedMillisecondsSinceEpoch;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "docCreatedMillisecondsSinceEpoch property",
  );
});

Deno.test("A doc with an invalid docCreatedByUserId property is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.docCreatedByUserId;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "docCreatedByUserId property",
  );
});

Deno.test("A doc with an invalid docLastUpdatedMillisecondsSinceEpoch property is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.docLastUpdatedMillisecondsSinceEpoch;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "docLastUpdatedMillisecondsSinceEpoch property",
  );
});

Deno.test("A doc with an invalid docLastUpdatedByUserId property is rejected.", () => {
  const doc = createDoc();
  const docRecord = doc as unknown as Record<string, unknown>;
  delete docRecord.docLastUpdatedByUserId;
  assertThrows(
    () => ensureDocSystemFields("test", doc),
    SengiDocValidationFailedError,
    "docLastUpdatedByUserId property",
  );
});
