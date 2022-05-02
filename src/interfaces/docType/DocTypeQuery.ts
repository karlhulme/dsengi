import { DocTypeQueryAuthProps } from "./DocTypeQueryAuthProps.ts";
import { DocTypeQueryParseProps } from "./DocTypeQueryParseProps.ts";

/**
 * Represents a query that can be executed against a collection of documents.
 */
export interface DocTypeQuery<User, Response, Parameters, QueryResult, Query> {
  /**
   * A description of the query.
   */
  summary?: string;

  /**
   * If populated, this query has been deprecated, and the property describes
   * the reason and/or the query to use instead.
   */
  deprecation?: string;

  /**
   * A function that returns an error message if the given parameters are not valid.
   * This function may alter the parameters to make them validate, such as removing unrecognised fields.
   */
  validateParameters?: (parameters: unknown) => string | void;

  /**
   * A function that converts the parameters into a Query that the
   * document store can interpret.  The Query type will be dependent
   * upon the choice of document store.
   */
  parse: (props: DocTypeQueryParseProps<User, Parameters>) => Query;

  /**
   * A function that returns an error message if the given response is not valid.
   * This function may alter the response to make it validate, such as removing unrecognised fields.
   */
  validateResponse?: (response: unknown) => string | void;

  /**
   * A function that converts the document store result into a response
   * for clients to consume.
   */
  coerce: (queryResult: QueryResult) => Response;

  /**
   * A function that returns an authorisation error if the request
   * should not be permitted.
   * The evaluation can be based on the user making the request
   * and/or the query parameters.
   */
  authorise?: (
    props: DocTypeQueryAuthProps<User, Parameters>,
  ) => string | undefined;
}
