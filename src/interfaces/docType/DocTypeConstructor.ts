import { DocTypeConstructorImplProps } from "./DocTypeConstructorImplProps.ts";

/**
 * Represents the constructor for a document type.
 */
export interface DocTypeConstructor<Doc, Parameters> {
  /**
   * A description of the purpose of the constructor.
   */
  summary?: string;

  /**
   * If populated, this constructor has been deprecated, and this property describes
   * the reason and/or the constructor to use instead.
   */
  deprecation?: string;

  /**
   * A function that returns an error message if the given parameters are not valid.
   * This function may alter the parameters to make them validate, such as removing unrecognised fields.
   */
  validateParameters?: (parameters: unknown) => string | void;

  /**
   * A function that returns a new document based on the given parameters.
   */
  implementation: (
    props: DocTypeConstructorImplProps<Parameters>,
  ) => Omit<Doc, "id" | "docType" | "docOpIds" | "docVersion">;
}
