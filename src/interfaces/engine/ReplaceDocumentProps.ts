import { DocRecord } from "../doc/index.ts";

/**
 * Defines the properties that are required to replace a document.
 */
export interface ReplaceDocumentProps<RequestProps, DocStoreOptions> {
  /**
   * The api key associated with the request.
   */
  apiKey: string;

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
  doc: DocRecord;

  /**
   * The properties passed with the request.
   */
  reqProps: RequestProps;

  /**
   * The document store options passed with the request.
   */
  docStoreOptions: DocStoreOptions;

  /**
   * The id of the user that is making the request.
   */
  userId: string;

  /**
   * An array of the claims that are held by the user.
   */
  userClaims: string[];

  /**
   * An array of fields to be returned after the document is replaced.
   */
  fieldNames: string[];
}
