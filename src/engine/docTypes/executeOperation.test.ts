import { assertEquals, assertThrows } from "../../../deps.ts";
import { DocBase, SengiOperationFailedError } from "../../interfaces/index.ts";
import { executeOperation } from "./executeOperation.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

function createDoc(): ExampleDoc {
  return {
    propA: "",
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

interface ExampleOperationParams {
  opPropA: string;
}

Deno.test("Accept valid operation request.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    propA: "foo",
  };

  executeOperation<ExampleDoc>(
    "test",
    (doc) => {
      doc.propA = "bar";
    },
    doc,
  );

  assertEquals(doc.propA, "bar");
});

Deno.test("Reject operation request if operation raises error.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    propA: "foo",
  };

  assertThrows(
    () =>
      executeOperation<ExampleDoc>(
        "test",
        () => {
          throw new Error("op threw");
        },
        doc,
      ),
    SengiOperationFailedError,
    "op threw",
  );
});
