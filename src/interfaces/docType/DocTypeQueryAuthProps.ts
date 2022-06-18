import { User } from "./User.ts";

/**
 * Represents the properties passed to a query authorisation function.
 */
export interface DocTypeQueryAuthProps<Parameters> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
