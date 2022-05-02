import { ClientDocPermissionSet } from "../../interfaces/index.ts";

/**
 * Returns true if create permission exists on the permission set.
 * @param permissionSet A permission set.
 */
export function canCreate(permissionSet: ClientDocPermissionSet): boolean {
  return permissionSet.create === true;
}
