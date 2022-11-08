import { SengiMissingPatchConfigError } from "../../interfaces/index.ts";

/**
 * Raises an error if the raise-change-events settings have not been set.
 * @param changeEventsDocTypeName The name of the document type for change events.
 * @param changeEventsDocStoreParams The params to be passed to the document
 * store when writing new change events.
 */
export function ensureRaiseChangeEventsConfig<DocStoreParams>(
  changeEventsDocTypeName?: string,
  changeEventsDocStoreParams?: DocStoreParams,
) {
  if (typeof changeEventsDocTypeName !== "string") {
    throw new SengiMissingPatchConfigError("changeEventsDocTypeName");
  }

  if (!changeEventsDocStoreParams) {
    throw new SengiMissingPatchConfigError("changeEventsDocStoreParams");
  }
}
