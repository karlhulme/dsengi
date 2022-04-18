/**
 * Represents the properties passed to a filter parse function.
 */
export interface DocTypeFilterParseProps<User, Parameters> {
  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
