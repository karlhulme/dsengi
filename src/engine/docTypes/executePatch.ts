import {
  DocBase,
  DocSystemFieldNames,
  PartialNullable,
  SengiPatchValidationFailedError,
} from "../../interfaces/index.ts";

/**
 * Applies the given patch to the given document.  The patch may produce fields that
 * are not valid for the overall document, if these are not corrected by the preSave
 * then an error will be raised when the document is validated.
 * @param docTypeName The name of a document type.
 * @param doc The doc that will be patched.
 * @param patch The patch to be applied.
 */
export function executePatch<Doc extends DocBase>(
  docTypeName: string,
  doc: Doc,
  patch: PartialNullable<Doc>,
): void {
  const patchKeys = Object.keys(patch);

  for (const patchKey of patchKeys) {
    if (DocSystemFieldNames.includes(patchKey)) {
      throw new SengiPatchValidationFailedError(
        docTypeName,
        `Cannot patch system field '${patchKey}'.`,
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
