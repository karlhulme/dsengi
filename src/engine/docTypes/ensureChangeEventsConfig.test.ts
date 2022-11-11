import { assertThrows } from "../../../deps.ts";
import { SengiMissingChangeEventsConfigError } from "../../interfaces/index.ts";
import { ensureChangeEventsConfig } from "./ensureChangeEventsConfig.ts";

Deno.test("Accept valid change event settings.", () => {
  ensureChangeEventsConfig("valid", { valid: "" });
});

Deno.test("Reject change events settings without a change events doc type name.", () => {
  assertThrows(
    () => ensureChangeEventsConfig(undefined, { valid: "" }),
    SengiMissingChangeEventsConfigError,
    "changeEventsDocTypeName",
  );
});

Deno.test("Reject change events without a params.", () => {
  assertThrows(
    () => ensureChangeEventsConfig("valid", undefined),
    SengiMissingChangeEventsConfigError,
    "changeEventsDocStoreParams",
  );
});
