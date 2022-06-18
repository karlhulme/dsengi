import { User } from "./User.ts";

/**
 * Represents the properties passed to the preSave function.
 */
export interface DocTypePreSaveProps<Doc> {
  /**
   * The document to operate on.
   */
  doc: Doc;

  /**
   * The user making the request.
   */
  user: User;
}
