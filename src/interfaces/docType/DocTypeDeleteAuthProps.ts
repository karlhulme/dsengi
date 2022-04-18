/**
 * Represents the properties passed to a function that authorises the
 * deletion of a document.
 */
export interface DocTypeDeleteAuthProps<Doc, User> {
  /**
   * The user that made the request.
   */
  user: User;

  /**
   * The document to be deleted.
   */
  doc: Doc;
}
