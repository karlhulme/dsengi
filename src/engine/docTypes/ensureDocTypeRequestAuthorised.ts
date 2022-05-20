import {
  AnyDocType,
  DocTypeCreateAuthProps,
  DocTypeDeleteAuthProps,
  DocTypeOperation,
  DocTypeOperationAuthProps,
  DocTypePatchAuthProps,
  DocTypeQuery,
  DocTypeQueryAuthProps,
  DocTypeReadAuthProps,
  SengiAuthorisationFailedError,
  SengiAuthoriseFunctionFailedError,
  SengiOperationAuthoriseFunctionFailedError,
  SengiQueryAuthoriseFunctionFailedError,
} from "../../interfaces/index.ts";

/**
 * Raises an error if the create action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypeCreateRequestAuthorised(
  docType: AnyDocType,
  authProps: DocTypeCreateAuthProps<unknown, unknown>,
): void {
  if (docType.authoriseCreate) {
    let result;

    try {
      result = docType.authoriseCreate(authProps);
    } catch (err) {
      throw new SengiAuthoriseFunctionFailedError(
        docType.name,
        "authoriseCreate",
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}

/**
 * Raises an error if the delete action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypeDeleteRequestAuthorised(
  docType: AnyDocType,
  authProps: DocTypeDeleteAuthProps<unknown, unknown>,
): void {
  if (docType.authoriseDelete) {
    let result;

    try {
      result = docType.authoriseDelete(authProps);
    } catch (err) {
      throw new SengiAuthoriseFunctionFailedError(
        docType.name,
        "authoriseDelete",
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}

/**
 * Raises an error if the operation action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypeOperationRequestAuthorised(
  docType: AnyDocType,
  operationName: string,
  docTypeOperation: DocTypeOperation<unknown, unknown, unknown>,
  authProps: DocTypeOperationAuthProps<unknown, unknown, unknown>,
): void {
  if (docTypeOperation.authorise) {
    let result;

    try {
      result = docTypeOperation.authorise(authProps);
    } catch (err) {
      throw new SengiOperationAuthoriseFunctionFailedError(
        docType.name,
        operationName,
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}

/**
 * Raises an error if the patch action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypePatchRequestAuthorised(
  docType: AnyDocType,
  authProps: DocTypePatchAuthProps<unknown, unknown>,
): void {
  if (docType.authorisePatch) {
    let result;

    try {
      result = docType.authorisePatch(authProps);
    } catch (err) {
      throw new SengiAuthoriseFunctionFailedError(
        docType.name,
        "authorisePatch",
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}

/**
 * Raises an error if the query action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypeQueryRequestAuthorised(
  docType: AnyDocType,
  queryName: string,
  docTypeQuery: DocTypeQuery<unknown, unknown, unknown, unknown>,
  authProps: DocTypeQueryAuthProps<unknown, unknown>,
): void {
  if (docTypeQuery.authorise) {
    let result;

    try {
      result = docTypeQuery.authorise(authProps);
    } catch (err) {
      throw new SengiQueryAuthoriseFunctionFailedError(
        docType.name,
        queryName,
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}

/**
 * Raises an error if the read action is not authorised.
 * @param docType The document type to authorise against.
 * @param authProps The properties to be passed to the authorisation function.
 */
export function ensureDocTypeReadRequestAuthorised(
  docType: AnyDocType,
  authProps: DocTypeReadAuthProps<unknown, unknown>,
): void {
  if (docType.authoriseRead) {
    let result;

    try {
      result = docType.authoriseRead(authProps);
    } catch (err) {
      throw new SengiAuthoriseFunctionFailedError(
        docType.name,
        "authoriseRead",
        err,
      );
    }

    if (typeof result === "string") {
      throw new SengiAuthorisationFailedError(docType.name, result);
    }
  }
}
