import {
  SengiQueryParamsValidationFailedError,
  SengiQueryParseFailedError,
  SengiQueryValidateParametersFailedError,
} from "../../interfaces/index.ts";

/**
 * Parses a set of query params into a query that can be
 * passed to the document store.
 * @param docTypeName The name of a document type.
 * @param queryParams A set of query params.
 */
export function parseQueryParams<Query, QueryParams>(
  docTypeName: string,
  validateParams: (params: unknown) => string | void,
  implementation: (params: QueryParams, userId: string) => Query,
  queryParams: QueryParams,
  userId: string,
): Query {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateParams(queryParams);
  } catch (err) {
    throw new SengiQueryValidateParametersFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiQueryParamsValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  let query;

  try {
    query = implementation(queryParams, userId);
  } catch (err) {
    throw new SengiQueryParseFailedError(docTypeName, err as Error);
  }

  return query;
}
