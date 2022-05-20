// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocRecord,
  DocType,
  DocTypeOperation,
  SengiAuthorisationFailedError,
  SengiOperationFailedError,
  SengiOperationParamsValidationFailedError,
  SengiOperationValidateParametersFailedError,
  SengiUnrecognisedOperationNameError,
} from "../../interfaces/index.ts";
import { executeOperation } from "./executeOperation.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

interface ExampleOperationParams {
  opPropA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    operations: {
      work: {
        validateParameters: (params: any) => {
          if (typeof params.opPropA !== "string") {
            return "missing opPropA string";
          } else if (params.opPropA === "err") {
            throw new Error("err");
          }
        },
        implementation: (props) => {
          if (props.parameters.opPropA === "fail") {
            throw new Error("fail");
          }

          props.doc.propA = props.parameters.opPropA;
        },
        authorise: (props) => {
          if (props.parameters.opPropA === "noAuth") {
            return "noAuth";
          }
        },
      } as DocTypeOperation<ExampleDoc, unknown, ExampleOperationParams>,
    },
  };

  return docType;
}

Deno.test("Accept valid operation request.", () => {
  const doc: DocRecord = { id: "abc", propA: "old" };
  executeOperation(createDocType(), null, "work", { opPropA: "abc" }, doc);
  assertEquals(doc, { id: "abc", propA: "abc" });
});

Deno.test("Reject operation request with an unrecognised name.", () => {
  assertThrows(
    () =>
      executeOperation(createDocType(), null, "unrecognised", {
        opPropA: "abc",
      }, {}),
    SengiUnrecognisedOperationNameError,
  );
});

Deno.test("Reject operation request if no operations defined.", () => {
  const docType = createDocType();
  delete docType.operations;
  assertThrows(
    () =>
      executeOperation(docType, null, "unrecognised", { opPropA: "abc" }, {}),
    SengiUnrecognisedOperationNameError,
  );
});

Deno.test("Reject operation request with invalid parameters.", () => {
  assertThrows(
    () => executeOperation(createDocType(), null, "work", { opPropA: 123 }, {}),
    SengiOperationParamsValidationFailedError,
    "missing opPropA string",
  );
});

Deno.test("Reject operation request if validateParameters function raises error.", () => {
  assertThrows(
    () =>
      executeOperation(createDocType(), null, "work", { opPropA: "err" }, {}),
    SengiOperationValidateParametersFailedError,
    "err",
  );
});

Deno.test("Reject operation request if operation raises error.", () => {
  assertThrows(
    () =>
      executeOperation(createDocType(), null, "work", { opPropA: "fail" }, {}),
    SengiOperationFailedError,
    "fail",
  );
});

Deno.test("Reject operation request if authorisation fails.", () => {
  assertThrows(
    () =>
      executeOperation(
        createDocType(),
        null,
        "work",
        { opPropA: "noAuth" },
        {},
      ),
    SengiAuthorisationFailedError,
    "noAuth",
  );
});

Deno.test("Skip operation authorisation if no authorisation method defined.", () => {
  const docType = createDocType();
  delete docType.operations?.work.authorise;
  const doc: DocRecord = { id: "abc", propA: "old" };
  executeOperation(docType, null, "work", { opPropA: "noAuth" }, doc);
  assertEquals(doc, { id: "abc", propA: "noAuth" });
});
