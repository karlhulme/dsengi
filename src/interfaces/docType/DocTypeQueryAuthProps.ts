/**
 * Represents the properties passed to a query authorisation function.
 */
export interface DocTypeQueryAuthProps<User, Parameters> {
  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
