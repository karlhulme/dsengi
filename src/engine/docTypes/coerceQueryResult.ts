import { SengiQueryCoerceFailedError } from "../../interfaces/index.ts";

/**
 * Coerce the result of executing a query into the published
 * query response shape.
 * @param docTypeName The name of a document type.
 * @param coerceResult A function that coerces the data returned from
 * the query into a QueryResult object.
 * @param rawQueryResult The result of executing the query as returned
 * from the document store.
 */
export function coerceQueryResult<QueryResult>(
  docTypeName: string,
  coerceResult: (result: unknown) => QueryResult,
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

  return queryResult;
}
