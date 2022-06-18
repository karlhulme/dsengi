import { DocBase } from "../doc/index.ts";
import { DocType, User } from "../docType/index.ts";

/**
 * Defines the properties passed to the saved doc callback.
 */
export interface SavedDocCallbackProps<
  RequestProps,
  Doc extends DocBase,
  DocStoreOptions,
  Filter,
  Query,
> {
  /**
   * The name of the client that invoked the operation.
   */
  clientName: string;

  /**
   * The resolved set of document store options.
   */
  docStoreOptions: DocStoreOptions;

  /**
   * The document type associated with the saved document.
   */
  docType: DocType<Doc, DocStoreOptions, Filter, Query>;

  /**
   * Any properties passed along with the request.
   */
  reqProps: RequestProps;

  /**
   * The document that has been saved.
   */
  doc: Doc;

  /**
   * True if the document is new, otherwise this document is being updated.
   */
  isNew: boolean | null;

  /**
   * The user that is making the request.
   */
  user: User;
}

/**
 * Defines the callback that is raised when a document is saved.
 */
export type SavedDocCallback<
  RequestProps,
  Doc extends DocBase,
  DocStoreOptions,
  Filter,
  Query,
> = (
  props: SavedDocCallbackProps<
    RequestProps,
    Doc,
    DocStoreOptions,
    Filter,
    Query
  >,
) => Promise<void>;
