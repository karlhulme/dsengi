import { assertThrows } from "../../../deps.ts";
import {
  AnyDocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanFetchWholeCollection } from "./ensureCanFetchWholeCollection.ts";

Deno.test("Remain silent if policy allows fetch whole collection action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
    policy: {
      canFetchWholeCollection: true,
    },
  };

  ensureCanFetchWholeCollection(docType);
});

Deno.test("Raise error if policy disallows fetch whole collection action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
    policy: {
      canFetchWholeCollection: false,
    },
  };

  assertThrows(
    () => ensureCanFetchWholeCollection(docType),
    SengiActionForbiddenByPolicyError,
    "fetch whole collection",
  );
});

Deno.test("Raise error if policy not specified for fetch whole collection action.", () => {
  const docType: AnyDocType = {
    name: "test",
    pluralName: "tests",
  };

  assertThrows(
    () => ensureCanFetchWholeCollection(docType),
    SengiActionForbiddenByPolicyError,
    "fetch whole collection",
  );
});
