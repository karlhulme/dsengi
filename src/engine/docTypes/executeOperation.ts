import { DocBase, SengiOperationFailedError } from "../../interfaces/index.ts";

/**
 * Operates on the given document using the given operation.
 * @param docTypeName The name of the document type.
 * @param operation A function that operates on a document.
 * @param doc The document to be operated upon.
 */
export function executeOperation<Doc extends DocBase>(
  docTypeName: string,
  operation: (doc: Doc) => void,
  doc: Doc,
): void {
  try {
    operation(doc);
  } catch (err) {
    throw new SengiOperationFailedError(
      docTypeName,
      err as Error,
    );
  }
}
