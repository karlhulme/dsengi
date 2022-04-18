/**
 * Represents the properties passed to the preSave function.
 */
export interface DocTypePreSaveProps<Doc, User> {
  /**
   * The document to operate on.
   */
  doc: Doc;

  /**
   * The user that has triggered the write action.
   */
  user: User;
}
