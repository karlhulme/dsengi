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
    propA: "",
    propB: "",
  } as unknown as ExampleDoc;
}

Deno.test("A valid patch that changes a value is applied.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    id: "123",
    propA: "aaa",
    propB: "bbb",
  };

  executePatch<ExampleDoc>(
    "test",
    doc,
    {
      propA: "AAA",
    },
  );

  assertEquals(doc, {
    id: "123",
    propA: "AAA",
    propB: "bbb",
  } as ExampleDoc);
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
    doc,
    {
      propC: null,
    },
  );

  assertEquals(doc, {
    id: "123",
    propA: "aaa",
    propB: "bbb",
  } as ExampleDoc);
});

Deno.test("A patch that attempts to change a system field is rejected.", () => {
  assertThrows(
    () =>
      executePatch<ExampleDoc>(
        "test",
        createDoc(),
        {
          id: "321",
        },
      ),
    SengiPatchValidationFailedError,
    "system field",
  );
});
