import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiUnrecognisedDocTypeNameError,
} from "../../interfaces/index.ts";
import { selectDocTypeFromArray } from "./selectDocTypeFromArray.ts";

function createDocTypes() {
  const docTypes: DocType[] = [{
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
  }, {
    name: "example",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
  }];

  return docTypes;
}

Deno.test("Find valid doc type by name", () => {
  const docTypes = createDocTypes();
  assertEquals(selectDocTypeFromArray(docTypes, "test"), docTypes[0]);
  assertEquals(selectDocTypeFromArray(docTypes, "example"), docTypes[1]);
});

Deno.test("Fail to find doc type if name is not recognised.", () => {
  assertThrows(
    () => selectDocTypeFromArray(createDocTypes(), "madeup"),
    SengiUnrecognisedDocTypeNameError,
    "not defined",
  );
});
