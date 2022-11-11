import { assertThrows } from "../../../deps.ts";
import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";
import { ensurePatchingConfig } from "./ensurePatchingConfig.ts";

Deno.test("Accept valid patch settings.", () => {
  ensurePatchingConfig("valid", { valid: "" });
});

Deno.test("Reject patch settings without a patch name.", () => {
  assertThrows(
    () => ensurePatchingConfig(undefined, { valid: "" }),
    SengiMissingPatchConfigError,
    "patchDocTypeName",
  );
});

Deno.test("Reject patch settings without params.", () => {
  assertThrows(
    () => ensurePatchingConfig("valid", undefined),
    SengiMissingPatchConfigError,
    "patchDocStoreParams",
  );
});
