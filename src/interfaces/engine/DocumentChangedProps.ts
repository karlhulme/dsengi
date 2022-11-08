/**
 * Represents the data supplied in a documentChanged event
 * raised by Sengi when a document is mutated.
 */
export interface DocumentChangedProps {
  /**
   * The digest of the change event.
   */
  digest: string;

  /**
   * The action that was performed.
   */
  action: string;

  /**
   * The id of the document that was changed.
   */
  subjectId: string;

  /**
   * The type of the document that was changed.
   */
  subjectDocType: string;

  /**
   * The set of field values on the document prior to the change
   * being applied.
   */
  preChangeFields: Record<string, unknown>;

  /**
   * The set of field values on the document after the change
   * has been applied.
   */
  postChangeFields: Record<string, unknown>;

  /**
   * The number of milliseconds since the unix epoch when this
   * change was applied.
   */
  timestampInMilliseconds: number;

  /**
   * The id of the user that initiated the change to the document.
   */
  changeUserId: string;
}
