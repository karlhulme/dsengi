import {
  AnyDocType,
  DocPatch,
  DocRecord,
  DocSystemFieldNames,
  SengiPatchValidationFailedError,
} from "../../interfaces/index.ts";

/**
 * Applies the given patch to the given document.  The patch may produce fields that
 * are not valid for the overall document, if these are not corrected by the preSave
 * then an error will be raised when the document is validated.
 * @param docType A document type.
 * @param doc The doc that will be patched.
 * @param patch A patch object.
 */
export function executePatch(
  docType: AnyDocType,
  doc: DocRecord,
  patch: DocPatch,
): void {
  const patchKeys = Object.keys(patch);

  for (const patchKey of patchKeys) {
    if (DocSystemFieldNames.includes(patchKey)) {
      throw new SengiPatchValidationFailedError(
        docType.name,
        `Cannot patch system field '${patchKey}'.`,
      );
    }

    if (docType.readOnlyFieldNames?.includes(patchKey)) {
      throw new SengiPatchValidationFailedError(
        docType.name,
        `Cannot patch read-only field '${patchKey}'.`,
      );
    }

    const patchValue = patch[patchKey];

    if (patchValue === null) {
      delete doc[patchKey];
    } else {
      doc[patchKey] = patchValue;
    }
  }
}
