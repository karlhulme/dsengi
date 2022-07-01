import {
  SengiFilterParamsValidationFailedError,
  SengiFilterParseFailedError,
  SengiFilterValidateParametersFailedError,
} from "../../interfaces/index.ts";

/**
 * Parses a set of filter params to produce a filter that can be
 * understood by the document store.
 * @param docTypeName The name of a document type.
 * @param validateParams A function for validating the filter params.
 * @param implementation A function for converting the filter params into a filter.
 * @param filterParams The parameters to be passed to the filter.
 * @param userId The id of the user making the request.
 */
export function parseFilterParams<Filter, FilterParams>(
  docTypeName: string,
  validateParams: (params: unknown) => string | void,
  implementation: (params: FilterParams, userId: string) => Filter,
  filterParams: FilterParams,
  userId: string,
): Filter {
  let validationErrorMessage;

  try {
    validationErrorMessage = validateParams(filterParams);
  } catch (err) {
    throw new SengiFilterValidateParametersFailedError(
      docTypeName,
      err,
    );
  }

  if (validationErrorMessage) {
    throw new SengiFilterParamsValidationFailedError(
      docTypeName,
      validationErrorMessage,
    );
  }

  let filter = null;

  try {
    filter = implementation(filterParams, userId);
  } catch (err) {
    throw new SengiFilterParseFailedError(
      docTypeName,
      err as Error,
    );
  }

  return filter;
}
