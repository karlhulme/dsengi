import { SengiInsufficientPermissionsError } from "../../interfaces/index.ts";
import { canCreate } from "./canCreate.ts";
import { canDelete } from "./canDelete.ts";
import { canOperate } from "./canOperate.ts";
import { canPatch } from "./canPatch.ts";
import { canSelect } from "./canSelect.ts";
import { canReplace } from "./canReplace.ts";
import { hasPermission } from "./hasPermission.ts";
import { canQuery } from "./canQuery.ts";
import { AuthenticatedClient } from "./AuthenticatedClient.ts";

/**
 * Raises an error if the given client does not have permission to
 * create a document of the given type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 */
export function ensureCreatePermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
): void {
  if (!hasPermission(authenticatedClient, docTypeName, canCreate)) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "create",
    );
  }
}

/**
 * Raises an error if given client does not have permission to delete a document
 * of the given type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 */
export function ensureDeletePermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
): void {
  if (!hasPermission(authenticatedClient, docTypeName, canDelete)) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "delete",
    );
  }
}

/**
 * Raises an error if the client does not have permission to invoke the
 * given operation on the given doc type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 * @param operationName The name of a doc type operation.
 */
export function ensureOperatePermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
  operationName: string,
): void {
  if (
    !hasPermission(
      authenticatedClient,
      docTypeName,
      (r) => canOperate(r, operationName),
    )
  ) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "update." + operationName,
    );
  }
}

/**
 * Raises an error if client does not have permission to invoke a
 * patch operation on the given doc type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 */
export function ensurePatchPermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
): void {
  if (!hasPermission(authenticatedClient, docTypeName, canPatch)) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "patch",
    );
  }
}

/**
 * Raises an error if the client does not have permission to execute
 * a query against a collectino of the given document types.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 * @param queryName The name of a doc type query.
 */
export function ensureQueryPermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
  queryName: string,
): void {
  if (
    !hasPermission(
      authenticatedClient,
      docTypeName,
      (r) => canQuery(r, queryName),
    )
  ) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "select." + queryName,
    );
  }
}

/**
 * Raises an error if client does not have permission to replace
 * documents of the given document type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 */
export function ensureReplacePermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
): void {
  if (!hasPermission(authenticatedClient, docTypeName, canReplace)) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      "replace",
    );
  }
}

/**
 * Raises an error if the client does not have permission to select
 * a set of documents from a collection of the given document type.
 * @param authenticatedClient The client associated with the request.
 * @param docTypeName The name of a doc type.
 * @param fieldNames An array of field names.
 */
export function ensureSelectPermission(
  authenticatedClient: AuthenticatedClient,
  docTypeName: string,
  fieldNames: string[],
): void {
  if (
    !hasPermission(
      authenticatedClient,
      docTypeName,
      (r) => canSelect(r, fieldNames),
    )
  ) {
    throw new SengiInsufficientPermissionsError(
      authenticatedClient.name,
      docTypeName,
      `select (${fieldNames.join(", ")})`,
    );
  }
}
