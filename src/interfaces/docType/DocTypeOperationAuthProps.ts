import { User } from "./User.ts";

/**
 * Represents the properties passed to an operation authorisation function.
 */
export interface DocTypeOperationAuthProps<Doc, Parameters> {
  /**
   * The document that is to be operated on.
   */
  doc: Doc;

  /**
   * The user making the request.
   */
  user: User;

  /**
   * The parameters passed to the operation.
   */
  parameters: Parameters;
}
