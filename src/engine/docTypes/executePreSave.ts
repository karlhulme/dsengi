import {
  AnyDocType,
  DocRecord,
  SengiPreSaveFailedError,
  User,
} from "../../interfaces/index.ts";

/**
 * Execute a doc type pre-save function.
 * @param docType A doc type.
 * @param doc A document that may be amended by the function.
 * @param user A user object.
 */
export function executePreSave(
  docType: AnyDocType,
  doc: DocRecord,
  user: User,
): void {
  if (typeof docType.preSave === "function") {
    try {
      docType.preSave({ doc, user });
    } catch (err) {
      throw new SengiPreSaveFailedError(docType.name, err as Error);
    }
  }
}
