import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiMissingNewIdFunctionError,
} from "../../interfaces/index.ts";
import { generateNewDocumentId } from "./generateNewDocumentId.ts";

Deno.test("Generate a new document id.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeEventFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
  };

  assertEquals(generateNewDocumentId(docType), "abcd");
});

Deno.test("Fail to generate a new document id if function not supplied.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "",
    changeEventFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
  };

  // deno-lint-ignore no-explicit-any
  delete (docType as any).newId;

  assertThrows(
    () => generateNewDocumentId(docType),
    SengiMissingNewIdFunctionError,
  );
});

Deno.test("Fail to generate a new document id if function throws an error.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => {
      throw new Error();
    },
    changeEventFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
  };

  assertThrows(
    () => generateNewDocumentId(docType),
    SengiMissingNewIdFunctionError,
  );
});

Deno.test("Fail to generate a new document id if function returns a non-string.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => 1234 as unknown as string,
    changeEventFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
  };

  assertThrows(
    () => generateNewDocumentId(docType),
    SengiMissingNewIdFunctionError,
  );
});
