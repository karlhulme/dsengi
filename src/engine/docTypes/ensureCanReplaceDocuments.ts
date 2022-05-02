import {
  AnyDocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the doc type policy does not allow
 * a document to be replaced.
 * @param docType A document type.
 */
export function ensureCanReplaceDocuments(docType: AnyDocType): void {
  if (docType.policy?.canReplaceDocuments !== true) {
    throw new SengiActionForbiddenByPolicyError(
      docType.name,
      "replace document",
    );
  }
}
