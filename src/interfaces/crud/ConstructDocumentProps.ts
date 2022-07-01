import { DocBase } from "../doc/index.ts";

/**
 * Defines the properties that are required to create a
 * document using a constructor.
 */
export interface ConstructDocumentProps<
  Doc extends DocBase,
  ConstructorParams,
  DocStoreParams,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: string;

  /**
   * The name of a document partition.
   */
  partition: string;

  /**
   * The id to be assigned to the new document.
   */
  id: string;

  /**
   * A function that validates a given set of parameters.
   */
  // deno-lint-ignore no-explicit-any
  validateParams: (params: any) => string | void;

  /**
   * A function that constructs a new document from the given parameters.
   * The implementation does not need to set the system fields, hence
   * a partial document may be returned.
   */
  implementation: (params: ConstructorParams, userId: string) => Partial<Doc>;

  /**
   * The parameters to be passed to the constructor.
   */
  constructorParams: ConstructorParams;

  /**
   * The parameters to be passed to the document store.
   */
  docStoreParams: DocStoreParams;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
