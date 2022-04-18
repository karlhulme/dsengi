import { DocPatchField } from "./DocPatchField.ts";

/**
 * Represents a patch to be applied to a document.
 */
export type DocPatch = Record<string, DocPatchField>;
