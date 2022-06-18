import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocRecord,
  DocType,
  SengiPreSaveFailedError,
  User,
} from "../../interfaces/index.ts";
import { executePreSave } from "./executePreSave.ts";

const dummyUser: User = { id: "test-0001", claims: [] };

interface ExampleDoc extends DocBase {
  propA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    preSave: (props) => {
      if (props.doc.propA === "fail") {
        throw new Error("fail");
      }

      props.doc.propA = props.doc.propA.toUpperCase();
    },
  };

  return docType;
}

Deno.test("Executing a valid pre-save function raises no errors.", () => {
  const doc: DocRecord = { propA: "abc" };
  executePreSave(createDocType(), doc, dummyUser);
  assertEquals(doc, { propA: "ABC" });
});

Deno.test("Executing a pre-save function on a doc type that does not define one raises no errors.", () => {
  const docType = createDocType();
  delete docType.preSave;
  const doc: DocRecord = { propA: "abc" };
  executePreSave(docType, doc, dummyUser);
  assertEquals(doc, { propA: "abc" });
});

Deno.test("Executing a pre-save function that raises errors will be wrapped.", () => {
  const doc: DocRecord = { propA: "fail" };
  assertThrows(
    () => executePreSave(createDocType(), doc, dummyUser),
    SengiPreSaveFailedError,
    "Error: fail",
  );
});
