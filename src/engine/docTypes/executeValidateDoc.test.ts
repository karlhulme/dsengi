// deno-lint-ignore-file no-explicit-any
import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocRecord,
  DocType,
  SengiDocValidationFailedError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";
import { executeValidateDoc } from "./executeValidateDoc.ts";

interface ExampleDoc extends DocBase {
  propA: string;
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
    validateDoc: (doc: any) => {
      if (doc.propA === "reject") {
        return "doc-rejected";
      } else if (doc.propA === "err") {
        throw new Error("doc-error");
      }
    },
  };

  return docType;
}

Deno.test("Executing a validator against valid data raises no errors.", () => {
  executeValidateDoc(createDocType(), {});
});

Deno.test("Executing a validator on a doc type that does not define a validator function raises no errors.", () => {
  const docType = createDocType();
  delete docType.validateDoc;
  executeValidateDoc(docType, {});
});

Deno.test("Executing a validator on a doc type that rejects the doc will be wrapped in a validation failed error.", () => {
  const doc: DocRecord = { propA: "reject" };
  assertThrows(
    () => executeValidateDoc(createDocType(), doc),
    SengiDocValidationFailedError,
    "doc-rejected",
  );
});

Deno.test("Executing a validator on a doc type that raises an error will be wrapped in a validate-doc error.", () => {
  const doc: DocRecord = { propA: "err" };
  assertThrows(
    () => executeValidateDoc(createDocType(), doc),
    SengiValidateDocFailedError,
    "doc-error",
  );
});
