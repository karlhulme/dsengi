import { DocBase, DocSystemFieldNamesUnion } from "../doc/index.ts";

/**
 * Defines the properties that are required to create
 * a new document from a fragment.
 */
export interface NewDocumentProps<Doc extends DocBase, DocStoreParams> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * The new document.  All of the system fields will be added automatically
   * expect for the id property which must be populated.
   */
  doc: Partial<Omit<Doc, DocSystemFieldNamesUnion>>;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
