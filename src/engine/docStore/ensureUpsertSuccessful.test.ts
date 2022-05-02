import { assertIsError, fail } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiConflictOnSaveError,
  SengiRequiredVersionNotAvailableError,
} from "../../interfaces/index.ts";
import { ensureUpsertSuccessful } from "./ensureUpsertSuccessful.ts";

Deno.test("Successful upserts are verified without errors being raised.", () => {
  ensureUpsertSuccessful({ code: DocStoreUpsertResultCode.CREATED }, false);
  ensureUpsertSuccessful({ code: DocStoreUpsertResultCode.REPLACED }, false);
  ensureUpsertSuccessful({ code: DocStoreUpsertResultCode.CREATED }, true);
  ensureUpsertSuccessful({ code: DocStoreUpsertResultCode.REPLACED }, true);
});

Deno.test("Conflict on save error raised if upsert fails due to required version being unavailable when reqVersion was NOT supplied externally.", () => {
  try {
    ensureUpsertSuccessful({
      code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
    }, false);
    fail();
  } catch (err) {
    assertIsError(err, SengiConflictOnSaveError);
  }
});

Deno.test("Conflict on save error raised if upsert fails due to required version being unavailable when reqVersion WAS supplied externally.", () => {
  try {
    ensureUpsertSuccessful({
      code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
    }, true);
    fail();
  } catch (err) {
    assertIsError(err, SengiRequiredVersionNotAvailableError);
  }
});
