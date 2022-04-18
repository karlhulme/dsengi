/**
 * Represents the properties passed to a query parse function.
 */
export interface DocTypeQueryParseProps<User, Parameters> {
  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
