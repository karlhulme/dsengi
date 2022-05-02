// deno-lint-ignore-file no-explicit-any
import { DocTypeConstructor } from "./DocTypeConstructor.ts";
import { DocTypeFilter } from "./DocTypeFilter.ts";
import { DocTypeOperation } from "./DocTypeOperation.ts";
import { DocTypeQuery } from "./DocTypeQuery.ts";
import { DocTypePolicy } from "./DocTypePolicy.ts";
import { DocTypePreSaveProps } from "./DocTypePreSaveProps.ts";
import { DocBase } from "../doc/index.ts";
import { DocTypeCreateAuthProps } from "./DocTypeCreateAuthProps.ts";
import { DocTypeDeleteAuthProps } from "./DocTypeDeleteAuthProps.ts";
import { DocTypePatchAuthProps } from "./DocTypePatchAuthProps.ts";
import { DocTypeReadAuthProps } from "./DocTypeReadAuthProps.ts";

/**
 * Represents a type of document that can be stored and managed.
 * The constructor, filter and operations all work with parameter objects
 * where any type could be used.  This is preferred to unknown, because it
 * allows a doc type author to use their strongly typed interface directly
 * in the implementation parameter declaration.  It is safe to do this
 * provided the correct jsonSchema has also been supplied.
 */
export interface DocType<
  Doc extends DocBase,
  DocStoreOptions,
  User,
  Filter,
  Query,
  QueryResult,
> {
  /**
   * The name of the document type.
   */
  name: string;

  /**
   * The plural name of the document type.
   */
  pluralName: string;

  /**
   * The title of the document type.
   */
  title?: string;

  /**
   * The plural title of the document type.
   */
  pluralTitle?: string;

  /**
   * A description of the usage of the document type.
   */
  summary?: string;

  /**
   * If populated, this document type has been deprecated, and this property describes
   * the reason and/or the document type to use in it's place.
   */
  deprecation?: string;

  /**
   * A record of constructors that can be used to build new documents.
   */
  constructors?: Record<string, DocTypeConstructor<Doc, User, any>>;

  /**
   * A record of filters that can be used to extract sections of the
   * document collection.
   */
  filters?: Record<string, DocTypeFilter<User, Filter, any>>;

  /**
   * A record of operations that can be used to update a document.
   */
  operations?: Record<string, DocTypeOperation<Doc, User, any>>;

  /**
   * A record of queries that can be executed against a document collection.
   */
  queries?: Record<string, DocTypeQuery<User, any, any, QueryResult, Query>>;

  /**
   * A function that can perform cleanup adjustments on a document, such as removing
   * deprecated fields or updating lastUpdated fields.
   * It operates directly on the given document.
   */
  preSave?: (props: DocTypePreSaveProps<Doc, User>) => void;

  /**
   * A function that returns an error message if the given doc does not contain valid field values.
   * This function may alter the document to make it validate, such as removing unrecognised fields.
   */
  validateDoc?: (doc: unknown) => string | void;

  /**
   * An array of field names that cannot be patched.
   */
  readOnlyFieldNames?: string[];

  /**
   * A function that returns an error message if the given user does not contain valid field values.
   * This function may alter the user to make it validate, such as removing unrecognised fields.
   */
  validateUser?: (user: unknown) => string | void;

  /**
   * The policy of the document type that governs which high level actions
   * can be invoked by clients.
   */
  policy?: DocTypePolicy;

  /**
   * Options that will be passed to the document store.
   * The type of data will be dependent on the choice of document store.
   */
  docStoreOptions?: DocStoreOptions;

  /**
   * A function that returns an authorisation error if the create request is not permitted.
   */
  authoriseCreate?: (
    props: DocTypeCreateAuthProps<Doc, User>,
  ) => string | undefined;

  /**
   * A function that returns an authorisation error if the delete request is not permitted.
   */
  authoriseDelete?: (
    props: DocTypeDeleteAuthProps<Doc, User>,
  ) => string | undefined;

  /**
   * A function that returns an authorisation error if the patch request is not permitted.
   */
  authorisePatch?: (
    props: DocTypePatchAuthProps<Doc, User>,
  ) => string | undefined;

  /**
   * A function that returns an authorisation error if the read request is not permitted.
   */
  authoriseRead?: (
    props: DocTypeReadAuthProps<Doc, User>,
  ) => string | undefined;
}

// interface Shape {
//   id?: string
//   docType?: string
//   docOpIds?: string[]
//   sides?: number
//   area?: number
//   lastUpdateBy: string
// }

// interface User {
//   name: string
//   maxArea: number
//   groups: string[]
// }

// interface AwsDocStoreOptions {
//   whatever: string
// }

// interface AwsFilter {
//   a: number
// }

// interface AwsQuery {
//   findMe: string
// }

// interface AwsQueryResult {
//   answer: string
// }

// interface NewExampleParams {
//   x: string
//   y: boolean
// }

// const exampleDocType: DocType<Shape, AwsDocStoreOptions, User, AwsFilter, AwsQuery, AwsQueryResult> = {
//   name: 'example',
//   pluralName: 'Examples',
//   title: 'Example',
//   pluralTitle: 'Examples',
//   summary: 'This is the example.',
//   jsonSchema: {},
//   constructors: {
//     newExample: {
//       summary: 'Create a new example',
//       parametersJsonSchema: {},
//       implementation: props => {
//         return ({
//           area: props.parameters.x.length,
//           sides: 2
//         })
//       }
//     } as DocTypeConstructor<Shape, User, NewExampleParams>
//   },
//   docStoreOptions: {
//     whatever: 'some value'
//   },
//   authoriseRead: props => {
//     if (props.user.maxArea > (props.doc.area || 0)) {
//       return 'Area too large.'
//     }
//   },
//   validate: props => {
//     if (typeof props.area === 'number' && props.area > 100) {
//       return 'area is too large'
//     }
//   },
//   preSave: props => {
//     props.doc.lastUpdateBy = props.user.name
//   }
// }

// console.log(exampleDocType)
