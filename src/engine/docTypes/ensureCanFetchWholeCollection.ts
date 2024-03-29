import {
  DocType,
  SengiActionForbiddenByPolicyError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the doc type policy does not allow
 * the entire collection to be fetched in one go.
 * @param docType A document type.
 */
export function ensureCanFetchWholeCollection<
  DocTypeNames extends string,
  DocStoreParams,
>(
  docType: DocType<DocTypeNames, DocStoreParams>,
): void {
  if (docType.policy?.canFetchWholeCollection !== true) {
    throw new SengiActionForbiddenByPolicyError(
      docType.name,
      "fetch whole collection",
    );
  }
}
