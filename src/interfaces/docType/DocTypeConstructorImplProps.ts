/**
 * Represents the properties passed to a constructor implementation.
 */
export interface DocTypeConstructorImplProps<User, Parameters> {
  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The parameters passed to the constructor.
   */
  parameters: Parameters;
}
