import { assertThrows } from "../../../deps.ts";
import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";
import { ensurePatchingConfig } from "./ensurePatchingConfig.ts";

Deno.test("Accept valid patch settings.", () => {
  ensurePatchingConfig("valid", { valid: "" }, () => "hello");
});

Deno.test("Reject patch settings without a patch name.", () => {
  assertThrows(
    () => ensurePatchingConfig(undefined, { valid: "" }, () => "hello"),
    SengiMissingPatchConfigError,
    "patchDocTypeName",
  );
});

Deno.test("Reject patch settings without params.", () => {
  assertThrows(
    () => ensurePatchingConfig("valid", undefined, () => "hello"),
    SengiMissingPatchConfigError,
    "patchDocStoreParams",
  );
});

Deno.test("Reject patch settings without a selection filter function.", () => {
  assertThrows(
    () => ensurePatchingConfig("valid", { valid: "" }, undefined),
    SengiMissingPatchConfigError,
    "patchSelectionFilter",
  );
});
