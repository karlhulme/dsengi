import { assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanDeleteDocuments } from "./ensureCanDeleteDocuments.ts";

Deno.test("Remain silent if policy allows delete action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    redactFieldNames: {},
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    policy: {
      canDeleteDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
  };

  ensureCanDeleteDocuments(docType);
});

Deno.test("Raise error if policy disallows delete action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    redactFieldNames: {},
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    policy: {
      canDeleteDocuments: false,
    },
    trackChanges: false,
    storePatches: false,
  };

  assertThrows(
    () => ensureCanDeleteDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "delete document",
  );
});

Deno.test("Raise error if policy not specified for delete action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    redactFieldNames: {},
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    trackChanges: false,
    storePatches: false,
  };

  assertThrows(
    () => ensureCanDeleteDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "delete document",
  );
});
