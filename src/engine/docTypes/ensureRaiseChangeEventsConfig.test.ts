import { assertThrows } from "../../../deps.ts";
import { SengiMissingChangeEventsConfigError } from "../../interfaces/index.ts";
import { ensureRaiseChangeEventsConfig } from "./ensureRaiseChangeEventsConfig.ts";

Deno.test("Accept valid change event settings.", () => {
  ensureRaiseChangeEventsConfig(async () => {}, "valid", { valid: "" });
});

Deno.test("Reject change events settings without a document changed handler function.", () => {
  assertThrows(
    () => ensureRaiseChangeEventsConfig(undefined, "valid", { valid: "" }),
    SengiMissingChangeEventsConfigError,
    "documentChanged",
  );
});

Deno.test("Reject change events settings without a change events doc type name.", () => {
  assertThrows(
    () =>
      ensureRaiseChangeEventsConfig(async () => {}, undefined, { valid: "" }),
    SengiMissingChangeEventsConfigError,
    "changeEventsDocTypeName",
  );
});

Deno.test("Reject change events without a params.", () => {
  assertThrows(
    () => ensureRaiseChangeEventsConfig(async () => {}, "valid", undefined),
    SengiMissingChangeEventsConfigError,
    "changeEventsDocStoreParams",
  );
});
