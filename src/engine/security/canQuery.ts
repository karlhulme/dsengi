import {
  ClientDocPermissionSet,
  ClientDocSelectPermissionSet,
} from "../../interfaces/index.ts";

/**
 * Returns true if query permission exists on the permission set
 * for the requested query.
 * @param permissionSet A permission set.
 * @param queryName The name of a query.
 */
export function canQuery(
  permissionSet: ClientDocPermissionSet,
  queryName: string,
): boolean {
  if (typeof permissionSet.select === "boolean") {
    return permissionSet.select;
  } else if (typeof permissionSet.select === "object") {
    const selectPermissionSet = permissionSet
      .select as ClientDocSelectPermissionSet;
    return Array.isArray(selectPermissionSet.queries) &&
      selectPermissionSet.queries.includes(queryName);
  } else {
    return false;
  }
}
