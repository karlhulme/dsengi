/**
 * Represents the properties passed to an operation authorisation function.
 */
export interface DocTypeOperationAuthProps<Doc, User, Parameters> {
  /**
   * The document that is to be operated on, before any changes have been applied.
   */
  originalDoc: Doc;

  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The parameters passed to the operation.
   */
  parameters: Parameters;
}
