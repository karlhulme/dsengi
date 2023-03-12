import { assertThrows } from "../../../deps.ts";
import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";
import { ensurePatchingConfig } from "./ensurePatchingConfig.ts";

Deno.test("Accept valid patch settings.", () => {
  ensurePatchingConfig("valid", { valid: "" }, () => "filter", () => "1234");
});

Deno.test("Reject patch settings without a patch name.", () => {
  assertThrows(
    () =>
      ensurePatchingConfig(
        undefined,
        { valid: "" },
        () => "filter",
        () => "1234",
      ),
    SengiMissingPatchConfigError,
    "patchDocTypeName",
  );
});

Deno.test("Reject patch settings without params.", () => {
  assertThrows(
    () =>
      ensurePatchingConfig("valid", undefined, () => "filter", () => "1234"),
    SengiMissingPatchConfigError,
    "patchDocStoreParams",
  );
});

Deno.test("Reject patch settings without a selection filter function.", () => {
  assertThrows(
    () => ensurePatchingConfig("valid", { valid: "" }, undefined, () => "1234"),
    SengiMissingPatchConfigError,
    "patchSelectionFilter",
  );
});

Deno.test("Reject patch settings without a new id function.", () => {
  assertThrows(
    () =>
      ensurePatchingConfig("valid", { valid: "" }, () => "filter", undefined),
    SengiMissingPatchConfigError,
    "patchNewId",
  );
});
