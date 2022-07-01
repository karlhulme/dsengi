import { DocBase } from "../doc/index.ts";

/**
 * Defines the properties that are required to replace a document.
 */
export interface ReplaceDocumentProps<Doc extends DocBase, DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * A new document to be used in place of any existing document.
   */
  doc: Doc;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;

  /**
   * An array of field names to return after the request has completed.
   */
  fieldNames: (keyof Doc)[];
}
