import { DocRecord } from "../doc/index.ts";

/**
 * Defines the properties that are required to create
 * a new document from a fragment.
 */
export interface NewDocumentProps<RequestProps, DocStoreOptions> {
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
   * The new document, which must have an id property.
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
   * The user that is making the request.
   */
  user: unknown;

  /**
   * An array of fields to be returned after the document is created.
   */
  fieldNames: string[];
}
