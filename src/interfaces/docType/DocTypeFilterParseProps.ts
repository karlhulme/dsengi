import { User } from "./User.ts";

/**
 * Represents the properties passed to a filter parse function.
 */
export interface DocTypeFilterParseProps<Parameters> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The parameters passed to the query.
   */
  parameters: Parameters;
}
