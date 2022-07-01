import { DocBase, SengiDocNotFoundError } from "../../interfaces/index.ts";

/**
 * Raises an error if the given doc is not an object, otherwise returns
 * the given document.
 * @param docTypeName A doc type name.
 * @param id The id of the document that was searched for.
 * @param doc The document object that was returned from a document store.
 */
export function ensureDocWasFound<Doc extends DocBase>(
  docTypeName: string,
  id: string,
  doc: Partial<Doc>,
): Partial<Doc> {
  if (typeof doc !== "object" || Array.isArray(doc) || doc === null) {
    throw new SengiDocNotFoundError(docTypeName, id);
  }

  return doc;
}
