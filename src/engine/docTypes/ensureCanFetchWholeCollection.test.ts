import { assertThrows } from "../../../deps.ts";
import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";
import { ensureCanFetchWholeCollection } from "./ensureCanFetchWholeCollection.ts";

Deno.test("Remain silent if policy allows fetch whole collection action.", () => {
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
    policy: {
      canFetchWholeCollection: true,
    },
  };

  ensureCanFetchWholeCollection(docType);
});

Deno.test("Raise error if policy disallows fetch whole collection action.", () => {
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
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
  const docType: DocType = {
    name: "test",
    readOnlyFieldNames: [],
    validateDoc: () => {},
    validateFields: () => {},
  };

  assertThrows(
    () => ensureCanFetchWholeCollection(docType),
    SengiActionForbiddenByPolicyError,
    "fetch whole collection",
  );
});
