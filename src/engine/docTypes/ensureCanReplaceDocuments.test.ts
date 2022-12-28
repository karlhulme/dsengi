import { assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanReplaceDocuments } from "./ensureCanReplaceDocuments.ts";

Deno.test("Remain silent if policy allows replace document action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    redactFieldNames: {},
    policy: {
      canReplaceDocuments: true,
    },
    trackChanges: false,
    storePatches: false,
  };

  ensureCanReplaceDocuments(docType);
});

Deno.test("Raise error if policy disallows replace document action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    redactFieldNames: {},
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    changeFieldNames: [],
    policy: {
      canReplaceDocuments: false,
    },
    trackChanges: false,
    storePatches: false,
  };

  assertThrows(
    () => ensureCanReplaceDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "replace document",
  );
});

Deno.test("Raise error if policy not specified for replace document action.", () => {
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
    () => ensureCanReplaceDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "replace document",
  );
});
