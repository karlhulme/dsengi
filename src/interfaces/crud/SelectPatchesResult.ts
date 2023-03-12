/**
 * Defines the shape of the response following a request to
 * select all the patches for a document.
 */
export interface SelectPatchesResult {
  /**
   * An array of patches.
   */
  patches: Patch[];
}

/**
 * A patch that was applied to a document.
 */
interface Patch {
  /**
   * The id of the patch document.
   */
  id: string;

  /**
   * The id of the operation that triggered the creation
   * of the patch.
   */
  operationId: string;

  /**
   * The id of the document that was patched.
   */
  patchedDocId: string;

  /**
   * The type of the document that was patched.
   */
  patchedDocType: string;

  /**
   * A record of the patched fields and their new associated values.
   */
  patch: Record<string, unknown>;

  /**
   * The number of milliseconds since the epoch that the
   * patch was applied.
   */
  docCreatedMillisecondsSinceEpoch: number;

  /**
   * The id of the user that generated the patch.
   */
  docCreatedByUserId: string;
}
