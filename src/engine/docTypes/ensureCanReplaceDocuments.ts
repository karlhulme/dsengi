import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the doc type policy does not allow
 * a document to be replaced.
 * @param docType A document type.
 */
export function ensureCanReplaceDocuments<
  DocTypeNames extends string,
  DocStoreParams,
>(
  docType: DocType<DocTypeNames, DocStoreParams>,
): void {
  if (docType.policy?.canReplaceDocuments !== true) {
    throw new SengiActionForbiddenByPolicyError(
      docType.name,
      "replace document",
    );
  }
}
