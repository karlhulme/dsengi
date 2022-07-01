import {
  SengiQueryCoerceFailedError,
  SengiQueryResponseValidationFailedError,
  SengiQueryValidateResponseFailedError,
} from "../../interfaces/index.ts";

/**
 * Coerce the result of executing a query into the published
 * query response shape.
 * @param docTypeName The name of a document type.
 * @param coerceResult A function that coerces the data returned from
 * the query into a QueryResult object.
 * @param validateResult A function that validates the build result
 * object.
 * @param rawQueryResult The result of executing the query as returned
 * from the document store.
 */
export function coerceQueryResult<QueryResult>(
  docTypeName: string,
  coerceResult: (result: unknown) => QueryResult,
  validateResult: (result: unknown) => string | void,
  rawQueryResult: unknown,
): QueryResult {
  let queryResult;

  try {
    queryResult = coerceResult(rawQueryResult);
  } catch (err) {
    throw new SengiQueryCoerceFailedError(
      docTypeName,
      err as Error,
    );
  }

  let validationErrorMessage;

  try {
    validationErrorMessage = validateResult(queryResult);
  } catch (err) {
    throw new SengiQueryValidateResponseFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiQueryResponseValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  return queryResult;
}
