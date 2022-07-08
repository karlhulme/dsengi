import {
  DocBase,
  DocSystemFieldNames,
  PartialNullable,
  SengiPatchValidationFailedError,
  SengiValidatePatchFailedError,
} from "../../interfaces/index.ts";

/**
 * Applies the given patch to the given document.  The patch may produce fields that
 * are not valid for the overall document, if these are not corrected by the preSave
 * then an error will be raised when the document is validated.
 * @param docTypeName The name of a document type.
 * @param readOnlyFieldNames An array of the read-only fields.
 * @param validateFields A function that validates the types and ranges of the fields
 * of the document to be patched.
 * @param doc The doc that will be patched.
 * @param patch The patch to be applied.
 */
export function executePatch<Doc extends DocBase>(
  docTypeName: string,
  readOnlyFieldNames: string[],
  validateFields: (patch: unknown) => string | void,
  doc: Doc,
  patch: PartialNullable<Doc>,
): void {
  let validationErrorMessage;

  // Clone the patch and then replace any missing or null
  // properties with the values from the original document.
  // This allows us to use validateDoc to check the patch fields.
  const patchUpdate = structuredClone(patch);

  for (const key of Object.keys(doc)) {
    if (typeof patchUpdate[key] === "undefined" || patchUpdate[key] === null) {
      patchUpdate[key] = (doc as Record<string, unknown>)[key];
    }
  }

  try {
    validationErrorMessage = validateFields(patchUpdate);
  } catch (err) {
    throw new SengiValidatePatchFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiPatchValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  // Use the original patch for the patching process,
  // do not use the update-only patch we created for validation.
  const patchKeys = Object.keys(patch);

  for (const patchKey of patchKeys) {
    if (DocSystemFieldNames.includes(patchKey)) {
      throw new SengiPatchValidationFailedError(
        docTypeName,
        `Cannot patch system field '${patchKey}'.`,
      );
    }

    if (readOnlyFieldNames?.includes(patchKey)) {
      throw new SengiPatchValidationFailedError(
        docTypeName,
        `Cannot patch read-only field '${patchKey}'.`,
      );
    }

    const docRecord = doc as unknown as Record<string, unknown>;
    const patchRecord = patch as unknown as Record<string, unknown>;

    const patchValue = patchRecord[patchKey];

    if (patchValue === null) {
      delete docRecord[patchKey];
    } else if (typeof patchValue !== "undefined") {
      docRecord[patchKey] = patchValue;
    }
  }
}
