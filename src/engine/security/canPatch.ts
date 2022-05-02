import {
  ClientDocPermissionSet,
  ClientDocUpdatePermissionSet,
} from "../../interfaces/index.ts";

/**
 * Returns true if patch permission exists on the permission set.
 * @param permissionSet A permission set.
 */
export function canPatch(permissionSet: ClientDocPermissionSet): boolean {
  if (typeof permissionSet.update === "boolean") {
    return permissionSet.update;
  } else if (typeof permissionSet.update === "object") {
    const updatePermissionSet = permissionSet
      .update as ClientDocUpdatePermissionSet;
    return updatePermissionSet.patch === true;
  } else {
    return false;
  }
}
