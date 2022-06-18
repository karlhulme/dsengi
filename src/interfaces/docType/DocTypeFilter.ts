import { DocTypeFilterParseProps } from "./DocTypeFilterParseProps.ts";

/**
 * Represents a filter that can be applied to a collection of documents.
 */
export interface DocTypeFilter<Filter, Parameters> {
  /**
   * A description of this filter.
   */
  summary?: string;

  /**
   * If populated, this filter has been deprecated, and the property describes
   * the reason and/or the filter to use instead.
   */
  deprecation?: string;

  /**
   * A function that returns an error message if the given parameters are not valid.
   * This function may alter the parameters to make them validate, such as removing unrecognised fields.
   */
  validateParameters?: (parameters: unknown) => string | void;

  /**
   * A function that builds a doc store filter based on the given parameters.
   * The Filter type is dependent upon the doc store in use.
   */
  parse: (props: DocTypeFilterParseProps<Parameters>) => Filter;
}
