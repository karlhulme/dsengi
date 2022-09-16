import { assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanReplaceDocuments } from "./ensureCanReplaceDocuments.ts";

Deno.test("Remain silent if policy allows replace document action.", () => {
  const docType: DocType<"test"> = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    policy: {
      canReplaceDocuments: true,
    },
  };

  ensureCanReplaceDocuments(docType);
});

Deno.test("Raise error if policy disallows replace document action.", () => {
  const docType: DocType<"test"> = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
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
  const docType: DocType<"test"> = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
  };

  assertThrows(
    () => ensureCanReplaceDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "replace document",
  );
});
