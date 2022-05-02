import {
  ClientDocPermissionSet,
  ClientDocSelectPermissionSet,
} from "../../interfaces/index.ts";

/**
 * Returns true if the requested field names can be honoured.
 * @param requestedFieldNames An array of requested field names.
 * @param whitelistedFieldNames An array of whitelisted field names.
 */
function determineIfReqFieldsConformsToWhitelist(
  requestedFieldNames: string[],
  whitelistedFieldNames: string[],
): boolean {
  for (const reqFn of requestedFieldNames) {
    if (!whitelistedFieldNames.includes(reqFn)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true if the requested field names do not clash with the blacklisted field names.
 * @param requestedFieldNames An array of requested field names.
 * @param blacklistedFieldNames An array of blacklisted field names.
 */
function determineIfReqFieldsConformsToBlacklist(
  requestedFieldNames: string[],
  blacklistedFieldNames: string[],
): boolean {
  for (const reqFn of requestedFieldNames) {
    if (blacklistedFieldNames.includes(reqFn)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns true if query permission exists on the permission set
 * for the requested field names.
 * @param permissionSet A permission set.
 * @param fieldNames An array of field names.
 */
export function canSelect(
  permissionSet: ClientDocPermissionSet,
  fieldNames: string[],
): boolean {
  if (typeof permissionSet.select === "boolean") {
    return permissionSet.select;
  } else if (typeof permissionSet.select === "object") {
    const selectPermissionSet = permissionSet
      .select as ClientDocSelectPermissionSet;

    if (selectPermissionSet.fieldsTreatment === "exclude") {
      return determineIfReqFieldsConformsToBlacklist(
        fieldNames,
        selectPermissionSet.fields,
      );
    } else {
      return determineIfReqFieldsConformsToWhitelist(
        fieldNames,
        selectPermissionSet.fields,
      );
    }
  } else {
    return false;
  }
}
