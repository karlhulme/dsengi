import { User } from "./User.ts";

/**
 * Represents the properties passed to a function that authorises the
 * creation of a new document.
 */
export interface DocTypeCreateAuthProps<Doc> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The type of request.
   */
  requestType: "create" | "new" | "replace";

  /**
   * The new document to be created.
   */
  newDoc: Doc;
}
