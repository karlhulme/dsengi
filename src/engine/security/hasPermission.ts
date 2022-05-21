import { ClientDocPermissionSet } from "../../interfaces/index.ts";
import { AuthenticatedClient } from "./AuthenticatedClient.ts";

/**
 * Returns true if the permissions associated with the given client are sufficient
 * to perform the requested action.
 * @param client The client making the request.
 * @param docTypeName The name of a document type.
 * @param permissionFunc A function that accepts a document permission set
 * and returns true if a permission is held.
 */
export function hasPermission(
  client: AuthenticatedClient,
  docTypeName: string,
  permissionFunc: (r: ClientDocPermissionSet) => boolean,
): boolean {
  // check for a global permission
  if (client.docPermissions === true) {
    return true;
  }

  // check for a docType-wide permission
  if (
    typeof client.docPermissions === "object" &&
    client.docPermissions[docTypeName] === true
  ) {
    return true;
  }

  // check for a docType specific permission
  if (
    typeof client.docPermissions === "object" &&
    typeof client.docPermissions[docTypeName] === "object"
  ) {
    if (
      permissionFunc(
        client.docPermissions[docTypeName] as ClientDocPermissionSet,
      )
    ) {
      return true;
    }
  }

  return false;
}
