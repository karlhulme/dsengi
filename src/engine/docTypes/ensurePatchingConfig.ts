import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";

/**
 * Raises an error if the patch settings have not been set.
 * @param patchDocTypeName The name of the document type for patches.
 * @param patchDocStoreParams The params to be passed to the document
 * store when writing new patches.
 * @param patchSelectionFilter A function for selecting patches.
 */
export function ensurePatchingConfig<DocStoreParams, Filter>(
  patchDocTypeName?: string,
  patchDocStoreParams?: DocStoreParams,
  patchSelectionFilter?: (
    partition: string,
    documentId: string,
    from?: string,
    limit?: number,
  ) => Filter,
) {
  if (typeof patchDocTypeName !== "string") {
    throw new SengiMissingPatchConfigError("patchDocTypeName");
  }

  if (!patchDocStoreParams) {
    throw new SengiMissingPatchConfigError("patchDocStoreParams");
  }

  if (typeof patchSelectionFilter !== "function") {
    throw new SengiMissingPatchConfigError("patchSelectionFilter");
  }
}
