import {
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
  SengiConflictOnSaveError,
  SengiRequiredVersionNotAvailableError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the upsert was not successful.
 * @param upsertResult An upsert result.
 * @param wasReqVersionSupplied True if the req version was supplied by an
 * external caller.
 */
export function ensureUpsertSuccessful(
  upsertResult: DocStoreUpsertResult,
  wasReqVersionSupplied: boolean,
): void {
  if (upsertResult.code === DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE) {
    if (wasReqVersionSupplied) {
      throw new SengiRequiredVersionNotAvailableError();
    } else {
      throw new SengiConflictOnSaveError();
    }
  }
}
