import { assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanDeleteDocuments } from "./ensureCanDeleteDocuments.ts";

Deno.test("Remain silent if policy allows delete action.", () => {
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    validatePatch: () => {},
    policy: {
      canDeleteDocuments: true,
    },
  };

  ensureCanDeleteDocuments(docType);
});

Deno.test("Raise error if policy disallows delete action.", () => {
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    validatePatch: () => {},
    policy: {
      canDeleteDocuments: false,
    },
  };

  assertThrows(
    () => ensureCanDeleteDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "delete document",
  );
});

Deno.test("Raise error if policy not specified for delete action.", () => {
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    validatePatch: () => {},
  };

  assertThrows(
    () => ensureCanDeleteDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "delete document",
  );
});
