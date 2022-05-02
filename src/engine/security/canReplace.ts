import { ClientDocPermissionSet } from "../../interfaces/index.ts";

/**
 * Returns true if replace permission exists on the permission set.
 * @param permissionSet A permission set.
 */
export function canReplace(permissionSet: ClientDocPermissionSet): boolean {
  return permissionSet.replace === true;
}
