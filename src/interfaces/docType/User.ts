/**
 * Represents the end-user that is requesting a change.
 */
export interface User {
  /**
   * The unique id of the user.
   */
  id: string;

  /**
   * An array of the claims held by the user.
   */
  claims: string[];
}
