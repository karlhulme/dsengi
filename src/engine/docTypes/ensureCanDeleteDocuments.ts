import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the doc type policy does not allow documents to be deleted.
 * @param docType A document type.
 */
export function ensureCanDeleteDocuments(docType: DocType): void {
  if (docType.policy?.canDeleteDocuments !== true) {
    throw new SengiActionForbiddenByPolicyError(
      docType.name,
      "delete document",
    );
  }
}
