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
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    redactFields: [],
    policy: {
      canDeleteDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
  };

  assertEquals(generateNewDocumentId(docType), "abcd");
});

Deno.test("Fail to generate a new document id if function not supplied.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    redactFields: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "",
    changeFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
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
    redactFields: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => {
      throw new Error();
    },
    changeFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
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
    redactFields: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => 1234 as unknown as string,
    changeFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
  };

  assertThrows(
    () => generateNewDocumentId(docType),
    SengiMissingNewIdFunctionError,
  );
});
