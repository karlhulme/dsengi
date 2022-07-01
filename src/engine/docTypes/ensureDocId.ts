import { DocBase, SengiDocIdMissing } from "../../interfaces/index.ts";

/**
 * Raises an error if the given document does not
 * have a string id property.
 * @param doc A document.
 */
export function ensureDocId(doc: Partial<DocBase>): void {
  if (typeof doc.id !== "string") {
    throw new SengiDocIdMissing();
  }
}
