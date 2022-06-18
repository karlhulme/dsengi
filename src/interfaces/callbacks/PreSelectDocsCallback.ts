import { DocBase } from "../doc/index.ts";
import { DocType, User } from "../docType/index.ts";

/**
 * Defines the properties passed to the pre select docs callback.
 */
export interface PreSelectDocsCallbackProps<
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
   * The document type associated with the documents being queried.
   */
  docType: DocType<Doc, DocStoreOptions, Filter, Query>;

  /**
   * Any properties passed along with the request.
   */
  reqProps: RequestProps;

  /**
   * The list of fields that have been requested by the client.
   */
  fieldNames: string[];

  /**
   * The user that is making the request.
   */
  user: User;
}

/**
 * Defines the callback that is raised just before a document collection is queried.
 */
export type PreSelectDocsCallback<
  RequestProps,
  Doc extends DocBase,
  DocStoreOptions,
  Filter,
  Query,
> = (
  props: PreSelectDocsCallbackProps<
    RequestProps,
    Doc,
    DocStoreOptions,
    Filter,
    Query
  >,
) => Promise<void>;
