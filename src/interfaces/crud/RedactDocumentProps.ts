/**
 * Defines the properties that are required to redact a document.
 */
export interface RedactDocumentProps<
  DocTypeNames extends string,
> {
  /**
   * The name of the document type that is targeted by the request.
   */
  docTypeName: DocTypeNames;

  /**
   * The name of a document partition.
   */
  partition: string | null;

  /**
   * The id of the operation.
   */
  operationId: string;

  /**
   * The id of a document.
   */
  id: string;

  /**
   * The value to use on any string fields where the redaction
   * value is '*'.  This is usually an id that represents a record
   * of data deletion instructions.
   */
  redactValue: string;

  /**
   * The id of the user that is making the request.
   */
  userId: string;
}
