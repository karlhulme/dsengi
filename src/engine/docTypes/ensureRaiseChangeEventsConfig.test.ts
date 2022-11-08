import { assertThrows } from "../../../deps.ts";
import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";
import { ensureRaiseChangeEventsConfig } from "./ensureRaiseChangeEventsConfig.ts";

Deno.test("Accept valid change event settings.", () => {
  ensureRaiseChangeEventsConfig("valid", { valid: "" });
});

Deno.test("Reject change events settings without a change events doc type name.", () => {
  assertThrows(
    () => ensureRaiseChangeEventsConfig(undefined, { valid: "" }),
    SengiMissingPatchConfigError,
    "changeEventsDocTypeName",
  );
});

Deno.test("Reject change events without a params.", () => {
  assertThrows(
    () => ensureRaiseChangeEventsConfig("valid", undefined),
    SengiMissingPatchConfigError,
    "changeEventsDocStoreParams",
  );
});
