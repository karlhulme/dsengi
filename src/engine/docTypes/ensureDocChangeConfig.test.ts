import { assertThrows } from "../../../deps.ts";
import { SengiMissingDocChangeConfigError } from "../../interfaces/index.ts";
import { ensureDocChangeConfig } from "./ensureDocChangeConfig.ts";

Deno.test("Accept valid change event settings.", () => {
  ensureDocChangeConfig("valid", { valid: "" });
});

Deno.test("Reject change events settings without a change events doc type name.", () => {
  assertThrows(
    () => ensureDocChangeConfig(undefined, { valid: "" }),
    SengiMissingDocChangeConfigError,
    "changeDocTypeName",
  );
});

Deno.test("Reject change events without a params.", () => {
  assertThrows(
    () => ensureDocChangeConfig("valid", undefined),
    SengiMissingDocChangeConfigError,
    "changeDocStoreParams",
  );
});
