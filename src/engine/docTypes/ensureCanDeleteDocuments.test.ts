import { assertThrows } from "../../../deps.ts";
import {
  AnyDocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanDeleteDocuments } from "./ensureCanDeleteDocuments.ts";

Deno.test("Remain silent if policy allows delete action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
    policy: {
      canDeleteDocuments: true,
    },
  };

  ensureCanDeleteDocuments(docType);
});

Deno.test("Raise error if policy disallows delete action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
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
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
  };

  assertThrows(
    () => ensureCanDeleteDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "delete document",
  );
});
