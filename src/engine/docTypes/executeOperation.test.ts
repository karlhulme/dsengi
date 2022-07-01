import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  SengiOperationFailedError,
  SengiOperationParamsValidationFailedError,
  SengiOperationValidateParametersFailedError,
} from "../../interfaces/index.ts";
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

  executeOperation<ExampleDoc, ExampleOperationParams>(
    "test",
    () => {},
    (doc, params) => {
      doc.propA = params.opPropA;
    },
    doc,
    {
      opPropA: "bar",
    },
    "me",
  );

  assertEquals(doc.propA, "bar");
});

Deno.test("Reject operation request with invalid parameters.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    propA: "foo",
  };

  assertThrows(
    () =>
      executeOperation<ExampleDoc, ExampleOperationParams>(
        "test",
        () => {
          return "invalid params";
        },
        (doc, params) => {
          doc.propA = params.opPropA;
        },
        doc,
        {
          opPropA: "bar",
        },
        "me",
      ),
    SengiOperationParamsValidationFailedError,
    "invalid params",
  );
});

Deno.test("Reject operation request if validateParameters function raises error.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    propA: "foo",
  };

  assertThrows(
    () =>
      executeOperation<ExampleDoc, ExampleOperationParams>(
        "test",
        () => {
          throw new Error("func threw");
        },
        (doc, params) => {
          doc.propA = params.opPropA;
        },
        doc,
        {
          opPropA: "bar",
        },
        "me",
      ),
    SengiOperationValidateParametersFailedError,
    "func threw",
  );
});

Deno.test("Reject operation request if operation raises error.", () => {
  const doc: ExampleDoc = {
    ...createDoc(),
    propA: "foo",
  };

  assertThrows(
    () =>
      executeOperation<ExampleDoc, ExampleOperationParams>(
        "test",
        () => {},
        () => {
          throw new Error("op threw");
        },
        doc,
        {
          opPropA: "bar",
        },
        "me",
      ),
    SengiOperationFailedError,
    "op threw",
  );
});
