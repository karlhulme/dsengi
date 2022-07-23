import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  SengiPatchValidationFailedError,
} from "../../interfaces/index.ts";
import { executePatch } from "./executePatch.ts";

interface ExampleDoc extends DocBase {
  propA: string;
  propB: string;
  propC?: string;
  propD?: number;
}

function createDoc(): ExampleDoc {
  return {
    id: "123",
    docType: "test",
    docStatus: "active",
    docOpIds: [],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",

    propA: "",
    propB: "",
  };
}

Deno.test("A valid patch changes a value is applied.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    id: "123",
    propA: "aaa",
    propB: "bbb",
  };

  executePatch<ExampleDoc>(
    "test",
    [],
    doc,
    {
      propA: "AAA",
    },
  );

  assertEquals(doc, {
    id: "123",
    propA: "AAA",
    propB: "bbb",
    docType: "test",
    docStatus: "active",
    docOpIds: [],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  });
});

Deno.test("A valid patch that removes a value is applied.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    id: "123",
    propA: "aaa",
    propB: "bbb",
    propC: "ccc",
  };

  executePatch<ExampleDoc>(
    "test",
    [],
    doc,
    {
      propC: null,
    },
  );

  assertEquals(doc, {
    id: "123",
    propA: "aaa",
    propB: "bbb",
    docType: "test",
    docStatus: "active",
    docOpIds: [],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  });
});

Deno.test("A patch that attempts to change a system field is rejected.", () => {
  assertThrows(
    () =>
      executePatch<ExampleDoc>(
        "test",
        [],
        createDoc(),
        {
          id: "321",
        },
      ),
    SengiPatchValidationFailedError,
    "system field",
  );
});

Deno.test("A patch that attempts to change a readonly field is rejected.", () => {
  assertThrows(
    () =>
      executePatch<ExampleDoc>(
        "test",
        ["propA"],
        createDoc(),
        {
          propA: "321",
        },
      ),
    SengiPatchValidationFailedError,
    "read-only field",
  );
});
