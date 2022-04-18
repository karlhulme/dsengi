import { ClientDocSelectPermissionSet } from "./ClientDocSelectPermissionSet.ts";
import { ClientDocUpdatePermissionSet } from "./ClientDocUpdatePermissionSet.ts";

/**
 * Represents a set of permissions for a document type.
 */
export interface ClientDocPermissionSet {
  /**
   * The permissions granted for selecting.
   */
  select?: boolean | ClientDocSelectPermissionSet;

  /**
   * The permissions granted for updating.
   */
  update?: boolean | ClientDocUpdatePermissionSet;

  /**
   * Specifies if a new document may be created.
   */
  create?: boolean;

  /**
   * Specifies if a document may be deleted.
   */
  delete?: boolean;

  /**
   * Specifies if a document may be replaced.
   */
  replace?: boolean;
}
