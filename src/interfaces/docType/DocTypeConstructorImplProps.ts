import { User } from "./User.ts";

/**
 * Represents the properties passed to a constructor implementation.
 */
export interface DocTypeConstructorImplProps<Parameters> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The parameters passed to the constructor.
   */
  parameters: Parameters;
}
