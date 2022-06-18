import { User } from "./User.ts";

/**
 * Represents the properties passed to a query parse function.
 */
export interface DocTypeQueryParseProps<Parameters> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
