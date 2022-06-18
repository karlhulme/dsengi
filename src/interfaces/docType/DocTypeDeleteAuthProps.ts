import { User } from "./User.ts";

/**
 * Represents the properties passed to a function that authorises the
 * deletion of a document.
 */
export interface DocTypeDeleteAuthProps<Doc> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The document to be deleted.
   */
  doc: Doc;
}
