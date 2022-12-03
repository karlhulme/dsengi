import { assertIsError, fail } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiConflictOnSaveError,
  SengiRequiredVersionNotAvailableError,
} from "../../interfaces/index.ts";
import { ensureUpsertSuccessful } from "./ensureUpsertSuccessful.ts";

Deno.test("Successful upserts are verified without errors being raised.", () => {
  ensureUpsertSuccessful({
    code: DocStoreUpsertResultCode.CREATED,
    sessionToken: "",
  }, false);
  ensureUpsertSuccessful({
    code: DocStoreUpsertResultCode.REPLACED,
    sessionToken: "",
  }, false);
  ensureUpsertSuccessful({
    code: DocStoreUpsertResultCode.CREATED,
    sessionToken: "",
  }, true);
  ensureUpsertSuccessful({
    code: DocStoreUpsertResultCode.REPLACED,
    sessionToken: "",
  }, true);
});

Deno.test("Conflict on save error raised if upsert fails due to required version being unavailable when reqVersion was NOT supplied externally.", () => {
  try {
    ensureUpsertSuccessful({
      code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
      sessionToken: "",
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
      sessionToken: "",
    }, true);
    fail();
  } catch (err) {
    assertIsError(err, SengiRequiredVersionNotAvailableError);
  }
});
