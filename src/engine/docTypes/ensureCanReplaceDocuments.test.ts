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
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    policy: {
      canReplaceDocuments: true,
    },
  };

  ensureCanReplaceDocuments(docType);
});

Deno.test("Raise error if policy disallows replace document action.", () => {
  const docType: DocType<"test", string> = {
    name: "test",
    docStoreParams: "",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
    policy: {
      canReplaceDocuments: false,
    },
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
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    newId: () => "abcd",
  };

  assertThrows(
    () => ensureCanReplaceDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "replace document",
  );
});
