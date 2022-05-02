// deno-lint-ignore-file no-explicit-any
import {
  AnyDocType,
  SengiFilterParamsValidationFailedError,
  SengiFilterParseFailedError,
  SengiFilterValidateParametersFailedError,
  SengiUnrecognisedFilterNameError,
} from "../../interfaces/index.ts";

/**
 * Parses a set of filter params to produce a filter that can be
 * understood by the document store.
 * @param docType A document type.
 * @param user A user object.
 * @param filterName The name of a filter.
 * @param filterParams A set of filter params.
 */
export function parseFilter(
  docType: AnyDocType,
  user: unknown,
  filterName: string,
  filterParams: unknown,
): any {
  const filterDef = docType.filters?.[filterName];

  if (typeof filterDef !== "object") {
    throw new SengiUnrecognisedFilterNameError(docType.name, filterName);
  }

  if (typeof filterDef.validateParameters === "function") {
    let validationErrorMessage;

    try {
      validationErrorMessage = filterDef.validateParameters(filterParams);
    } catch (err) {
      throw new SengiFilterValidateParametersFailedError(
        docType.name,
        filterName,
        err,
      );
    }

    if (validationErrorMessage) {
      throw new SengiFilterParamsValidationFailedError(
        docType.name,
        filterName,
        validationErrorMessage,
      );
    }
  }

  let filter = null;

  try {
    filter = filterDef.parse({ user, parameters: filterParams });
  } catch (err) {
    throw new SengiFilterParseFailedError(
      docType.name,
      filterName,
      err as Error,
    );
  }

  return filter;
}
