import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";

/**
 * Raises an error if the patch settings have not been set.
 * @param patchDocTypeName The name of the document type for patches.
 * @param patchDocStoreParams The params to be passed to the document
 * store when writing new patches.
 */
export function ensureStorePatchesConfig<DocStoreParams>(
  patchDocTypeName?: string,
  patchDocStoreParams?: DocStoreParams,
) {
  if (typeof patchDocTypeName !== "string") {
    throw new SengiMissingPatchConfigError("patchDocTypeName");
  }

  if (!patchDocStoreParams) {
    throw new SengiMissingPatchConfigError("patchDocStoreParams");
  }
}
