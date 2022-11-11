/**
 * Represents the data supplied in a documentChanged event
 * raised by Sengi when a document is mutated.
 */
export interface DocumentChangedEventProps {
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
   * A subset of the subject document being mutated that triggered this event.
   * The fields are specified on the document type as changeEventFieldNames.
   * For all events, this property contains the field values before any mutation
   * has taken place.
   */
  subjectFields: Record<string, unknown>;

  /**
   * The subject of the patch to be applied in a patch event, based  on the fields
   * specified on the document type as changeEventFieldNames.
   * For archive, delete and creation event this field will be an empty object.
   */
  subjectPatchFields: Record<string, unknown>;

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
