import { assertThrows } from "../../../deps.ts";
import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";
import { ensureStorePatchesConfig } from "./ensureStorePatchesConfig.ts";

Deno.test("Accept valid patch settings.", () => {
  ensureStorePatchesConfig("valid", { valid: "" });
});

Deno.test("Reject patch settings without a patch name.", () => {
  assertThrows(
    () => ensureStorePatchesConfig(undefined, { valid: "" }),
    SengiMissingPatchConfigError,
    "patchDocTypeName",
  );
});

Deno.test("Reject patch settings without params.", () => {
  assertThrows(
    () => ensureStorePatchesConfig("valid", undefined),
    SengiMissingPatchConfigError,
    "patchDocStoreParams",
  );
});
