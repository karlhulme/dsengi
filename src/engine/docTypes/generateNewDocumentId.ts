import {
  DocType,
  SengiMissingNewIdFunctionError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the doc type policy does not allow documents to be deleted.
 * @param docType A document type.
 */
export function generateNewDocumentId<
  DocTypeNames extends string,
  DocStoreParams,
>(
  docType: DocType<DocTypeNames, DocStoreParams>,
) {
  if (typeof docType.newId !== "function") {
    throw new SengiMissingNewIdFunctionError(
      docType.name,
    );
  } else {
    try {
      const id = docType.newId();

      if (typeof id === "string") {
        return id;
      } else {
        throw new SengiMissingNewIdFunctionError(
          docType.name,
        );
      }
    } catch {
      throw new SengiMissingNewIdFunctionError(
        docType.name,
      );
    }
  }
}
