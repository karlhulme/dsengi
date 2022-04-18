import { DocTypeFilterParseProps } from "./DocTypeFilterParseProps.ts";

/**
 * Represents a filter that can be applied to a collection of documents.
 */
export interface DocTypeFilter<User, Filter, Parameters> {
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
   * A JSON schema that describes the shape of the filter parameters.
   */
  parametersJsonSchema: Record<string, unknown>;

  /**
   * A function that builds a doc store filter based on the given parameters.
   * The Filter type is dependent upon the doc store in use.
   */
  parse: (props: DocTypeFilterParseProps<User, Parameters>) => Filter;
}
