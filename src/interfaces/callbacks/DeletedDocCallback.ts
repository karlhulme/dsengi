import { DocBase } from "../doc/index.ts";
import { DocType, User } from "../docType/index.ts";

/**
 * Defines the properties passed to the delete callback.
 */
export interface DeletedDocCallbackProps<
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
   * The document type associated with the deleted document.
   */
  docType: DocType<Doc, DocStoreOptions, Filter, Query>;

  /**
   * Any properties passed along with the request.
   */
  reqProps: RequestProps;

  /**
   * The id of the document was that deleted.
   */
  id: string;

  /**
   * The user that is making the request.
   */
  user: User;
}

/**
 * Defines the callback that is raised when a document is deleted.
 */
export type DeletedDocCallback<
  RequestProps,
  Doc extends DocBase,
  DocStoreOptions,
  Filter,
  Query,
> = (
  props: DeletedDocCallbackProps<
    RequestProps,
    Doc,
    DocStoreOptions,
    Filter,
    Query
  >,
) => Promise<void>;
