import { assertThrows } from "../../../deps.ts";
import {
  AnyDocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanReplaceDocuments } from "./ensureCanReplaceDocuments.ts";

Deno.test("Remain silent if policy allows replace document action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
    policy: {
      canReplaceDocuments: true,
    },
  };

  ensureCanReplaceDocuments(docType);
});

Deno.test("Raise error if policy disallows replace document action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
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
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
  };

  assertThrows(
    () => ensureCanReplaceDocuments(docType),
    SengiActionForbiddenByPolicyError,
    "replace document",
  );
});
