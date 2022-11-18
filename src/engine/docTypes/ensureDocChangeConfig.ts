import { SengiMissingDocChangeConfigError } from "../../interfaces/index.ts";

/**
 * Raises an error if the document change tracking settings have not been set.
 * @param changeDocTypeName The name of the document type for change events.
 * @param changeDocStoreParams The params to be passed to the document
 * store when writing new change events.
 */
export function ensureDocChangeConfig<DocStoreParams>(
  changeDocTypeName?: string,
  changeDocStoreParams?: DocStoreParams,
) {
  if (typeof changeDocTypeName !== "string") {
    throw new SengiMissingDocChangeConfigError("changeDocTypeName");
  }

  if (!changeDocStoreParams) {
    throw new SengiMissingDocChangeConfigError("changeDocStoreParams");
  }
}
