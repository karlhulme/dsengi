// deno-lint-ignore-file no-explicit-any
import {
  AnyDocType,
  SengiQueryCoerceFailedError,
  SengiQueryResponseValidationFailedError,
  SengiQueryValidateResponseFailedError,
  SengiUnrecognisedQueryNameError,
} from "../../interfaces/index.ts";

/**
 * Coerce the result of executing a query into the published
 * query response shape.
 * @param docType A document type.
 * @param queryName The name of a query.
 * @param queryResultData The result of executing the query as returned
 * from the document store.
 */
export function coerceQuery(
  docType: AnyDocType,
  queryName: string,
  queryResultData: unknown,
): any {
  const queryDef = docType.queries?.[queryName];

  if (typeof queryDef !== "object") {
    throw new SengiUnrecognisedQueryNameError(docType.name, queryName);
  }

  let response = null;

  try {
    response = queryDef.coerce(queryResultData);
  } catch (err) {
    throw new SengiQueryCoerceFailedError(
      docType.name,
      queryName,
      err as Error,
    );
  }

  if (queryDef.validateResponse) {
    let validationErrorMessage;

    try {
      validationErrorMessage = queryDef.validateResponse(response);
    } catch (err) {
      throw new SengiQueryValidateResponseFailedError(
        docType.name,
        queryName,
        err,
      );
    }

    if (validationErrorMessage) {
      throw new SengiQueryResponseValidationFailedError(
        docType.name,
        queryName,
        validationErrorMessage,
      );
    }
  }

  return response;
}
