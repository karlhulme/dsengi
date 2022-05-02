import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  AnyDocType,
  SengiUnrecognisedDocTypeNameError,
} from "../../interfaces/index.ts";
import { selectDocTypeFromArray } from "./selectDocTypeFromArray.ts";

function createDocTypes() {
  const docTypes: AnyDocType[] = [{
    name: "test",
    pluralName: "tests",
  }, {
    name: "example",
    pluralName: "examples",
  }];

  return docTypes;
}

Deno.test("Find valid doc types by name", () => {
  const docTypes = createDocTypes();
  assertEquals(selectDocTypeFromArray(docTypes, "test"), docTypes[0]);
  assertEquals(selectDocTypeFromArray(docTypes, "example"), docTypes[1]);
});

Deno.test("Fail to find invalid doc types by name.", () => {
  assertThrows(
    () => selectDocTypeFromArray(createDocTypes(), "madeup"),
    SengiUnrecognisedDocTypeNameError,
    "not defined",
  );
});
