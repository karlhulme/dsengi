/**
 * Defines a set of allowed update mechanisms.
 */
export interface ClientDocUpdatePermissionSet {
  /**
   * True if a client may issue patches.
   */
  patch?: boolean;

  /**
   * A list of operations that the client may call.
   */
  operations?: string[];
}
