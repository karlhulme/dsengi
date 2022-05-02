import {
  ClientDocPermissionSet,
  ClientDocUpdatePermissionSet,
} from "../../interfaces/index.ts";

/**
 * Returns true if operate permission exists on the permission set
 * for the requested operation.
 * @param permissionSet A permission set.
 * @param operationName The name of an operation.
 */
export function canOperate(
  permissionSet: ClientDocPermissionSet,
  operationName: string,
): boolean {
  if (typeof permissionSet.update === "boolean") {
    return permissionSet.update;
  } else if (typeof permissionSet.update === "object") {
    const updatePermissionSet = permissionSet
      .update as ClientDocUpdatePermissionSet;
    return Array.isArray(updatePermissionSet.operations) &&
      updatePermissionSet.operations.includes(operationName);
  } else {
    return false;
  }
}
