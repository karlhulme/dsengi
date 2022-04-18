import { DocTypeOperationAuthProps } from "./DocTypeOperationAuthProps.ts";
import { DocTypeOperationImplProps } from "./DocTypeOperationImplProps.ts";

/**
 * Represents an operation that can be applied to a document.
 */
export interface DocTypeOperation<Doc, User, Parameters> {
  /**
   * A description of the operation.
   */
  summary?: string;

  /**
   * If populated, this operation has been deprecated, and this property describes
   * the reason and/or the operation to use instead.
   */
  deprecation?: string;

  /**
   * A JSON schema that describes the shape of the parameters to the operation.
   */
  parametersJsonSchema: Record<string, unknown>;

  /**
   * A function that updates a document based on the given operation parameters.
   */
  implementation: (
    props: DocTypeOperationImplProps<Doc, User, Parameters>,
  ) => void;

  /**
   * A function that returns an authorisation error if the request
   * should not be permitted.
   * The evaluation can be based on the user making the request and/or
   * the document to be amended and/or the operation parameters.
   */
  authorise?: (
    props: DocTypeOperationAuthProps<Doc, User, Parameters>,
  ) => string | undefined;
}
