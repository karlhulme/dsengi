// deno-lint-ignore-file no-explicit-any
import {
  AnyDocType,
  SengiQueryParamsValidationFailedError,
  SengiQueryParseFailedError,
  SengiQueryValidateParametersFailedError,
  SengiUnrecognisedQueryNameError,
} from "../../interfaces/index.ts";
import { ensureDocTypeQueryRequestAuthorised } from "./ensureDocTypeRequestAuthorised.ts";

/**
 * Parses a set of query params into a query that can be
 * passed to the document store.
 * @param docType A document type.
 * @param user: A user object.
 * @param queryName The name of a query.
 * @param queryParams A set of query params.
 */
export function parseQuery(
  docType: AnyDocType,
  user: unknown,
  queryName: string,
  queryParams: unknown,
): any {
  const queryDef = docType.queries?.[queryName];

  if (typeof queryDef !== "object") {
    throw new SengiUnrecognisedQueryNameError(docType.name, queryName);
  }

  if (queryDef.validateParameters) {
    let validationErrorMessage;

    try {
      validationErrorMessage = queryDef.validateParameters(queryParams);
    } catch (err) {
      throw new SengiQueryValidateParametersFailedError(
        docType.name,
        queryName,
        err,
      );
    }

    if (validationErrorMessage) {
      throw new SengiQueryParamsValidationFailedError(
        docType.name,
        queryName,
        validationErrorMessage,
      );
    }
  }

  ensureDocTypeQueryRequestAuthorised(docType, queryName, queryDef, {
    parameters: queryParams,
    user: user,
  });

  let query = null;

  try {
    query = queryDef.parse({ user, parameters: queryParams });
  } catch (err) {
    throw new SengiQueryParseFailedError(docType.name, queryName, err as Error);
  }

  return query;
}
