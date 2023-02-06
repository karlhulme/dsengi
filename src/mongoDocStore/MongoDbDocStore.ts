import {
  Filter,
  MongoClient,
  MongoClientOptions,
  ServerApiVersion,
} from "../../deps.ts";
import {
  DocStatuses,
  DocStore,
  DocStoreDeleteByIdResult,
  DocStoreDeleteByIdResultCode,
  DocStoreExistsResult,
  DocStoreFetchResult,
  DocStoreQueryResult,
  DocStoreRecord,
  DocStoreSelectResult,
  DocStoreUpsertResult,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";

/**
 * The maximum number of documents that can be retrieved in a single select.
 * If more documents are required, then use the selectByFilter functionality
 * to retrieve the data in batches.
 */
const MAX_DOCS_TO_SELECT = 200;

/**
 * Defines the parameters that must be passed to the Mongo
 * document store.
 */
export interface MongoDbDocStoreParams {
  /**
   * The name of a MongoDb database.
   */
  databaseName: string;

  /**
   * The name of a MongoDb collection.
   */
  collectionName: string;
}

/**
 * Represents a filter that can be applied to a collection of documents.
 */
export interface MongoDbDocStoreFilter {
  /**
   * A MongoDb filter document.
   */
  whereClause?: Record<string, unknown>;

  /**
   * An array of fields to sort by.  These should be supported
   * by an index defined on the collection.
   */
  orderByFields?: MongoDbDocStoreFilterOrderByField[];

  /**
   * The maximum number of documents to return.
   */
  limit?: number;
}

/**
 * Represents a field that is used to order the results of a query.
 */
export interface MongoDbDocStoreFilterOrderByField {
  /**
   * The name of a field.
   */
  fieldName: string;

  /**
   * The order direction.  If not specified, an ascending order is used.
   */
  direction?: "ascending" | "descending";
}

/**
 * Represents a query that can be executed against a collection of documents.
 */
export type MongoDbDocStoreQuery =
  | MongoDbDocStoreCountQuery
  | MongoDbDocStoreAggregateQuery;

/**
 * Represents a query that can count a number of documents in a collection.
 */
export interface MongoDbDocStoreCountQuery {
  type: "count";
  filter?: Filter<DocStoreRecord>;
}

/**
 * Represents a query that perform a series of projections on a set of documents.
 */
export interface MongoDbDocStoreAggregateQuery {
  type: "aggregate";
  pipeline: unknown[];
}

/**
 * Represents the result of a query executed against a document collection.
 */
export interface MongoDbDocStoreQueryResult {
  /**
   * If populated, contains the result of an executed query.
   */
  docs?: DocStoreRecord[];
}

/**
 * The parameters for constructing a MongoDbDocStore.
 */
interface MongoDbDocStoreConstructorProps {
  /**
   * The connection string of the MongoDb instance, that includes
   * the credentials required for authentication.
   */
  connectionString: string;

  /**
   * True if the client should raise errors under the strictest
   * conditions, such as attempts to access deprecated methods.
   * This can be set to true for development and test environments
   * to pickup issues early, but should be false for production
   * environments.
   */
  strict: boolean;

  /**
   * Returns a random set of characters that is assigned to
   * a document so you know if the document has changed.
   */
  generateDocVersionFunc: () => string;
}

/**
 * A document store implementation for Mongo DB.
 */
export class MongoDbDocStore implements
  DocStore<
    MongoDbDocStoreParams,
    MongoDbDocStoreFilter,
    MongoDbDocStoreQuery
  > {
  client: MongoClient;
  generateDocVersionFunc: () => string;

  /**
   * Constructs a new instance of the document store.
   * @param props The constructor properties.
   */
  constructor(props: MongoDbDocStoreConstructorProps) {
    const connOptions: Partial<MongoClientOptions> = {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: props.strict,
        deprecationErrors: props.strict,
      },
      // Can set readConcern and writeConcern to configure isolation.
      // Default is READ UNCOMMITTED.
      // https://www.mongodb.com/docs/manual/core/read-isolation-consistency-recency/#read-uncommitted

      // Params mentioned in use of 4.1, but may now be deprecated:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    };

    this.client = new MongoClient(
      props.connectionString,
      connOptions as MongoClientOptions,
    );

    this.generateDocVersionFunc = props.generateDocVersionFunc;
  }

  /**
   * Return a new document with the Mongo internal fields
   * removed and the id field renamed from _id.
   * @param doc A document retrieved from a Cosmos database.
   */
  private cleanDoc(doc: Record<string, unknown>): DocStoreRecord {
    const { _id, ...others } = doc;

    return {
      id: _id,
      ...others,
    } as DocStoreRecord;
  }

  /**
   * Returns the collection.
   * @param docStoreParams The parameters for the document store.
   */
  private getCollection(docStoreParams: MongoDbDocStoreParams) {
    return this.client.db(docStoreParams.databaseName).collection(
      docStoreParams.collectionName,
    );
  }

  /**
   * Delete a single document from the store using it's id.
   * @param _docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param docStoreParams The parameters for the document store.
   */
  async deleteById(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreDeleteByIdResult> {
    const coll = this.getCollection(docStoreParams);

    const deleteOneResult = await coll.deleteOne({
      _id: id,
      docType: docTypeName,
      partitionKey: partition,
    });

    const resultCode = deleteOneResult.deletedCount > 0
      ? DocStoreDeleteByIdResultCode.DELETED
      : DocStoreDeleteByIdResultCode.NOT_FOUND;

    return {
      code: resultCode,
      sessionToken: "",
    };
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param docStoreParams The parameters for the document store.
   */
  async exists(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreExistsResult> {
    const coll = this.getCollection(docStoreParams);

    const count = await coll.countDocuments({
      _id: id,
      docType: docTypeName,
      partitionKey: partition,
    });

    return { found: count === 1 };
  }

  /**
   * Fetch a single document using it's id.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param docStoreParams The parameters for the document store.
   */
  async fetch(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreFetchResult> {
    const coll = this.getCollection(docStoreParams);

    const findOneResult = await coll.findOne({
      _id: id,
      docType: docTypeName,
      partitionKey: partition,
    });

    let doc = null;

    if (findOneResult) {
      doc = this.cleanDoc(findOneResult);
    }

    return { doc };
  }

  /**
   * Execute a query against the document store.  The result will be
   * an array of documents, although in many cases, there will be a
   * single document in the resulting array which contains a calculated
   * value.
   * @param _docTypeName The name of a doc type.
   * @param query A query to execute that should include a clause for
   * a specific partition.
   * @param docStoreParams The parameters for the document store.
   */
  async query(
    _docTypeName: string,
    query: MongoDbDocStoreQuery,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreQueryResult> {
    const coll = this.getCollection(docStoreParams);

    switch (query.type) {
      default:
      case "count": {
        const count = await coll.countDocuments(query.filter);

        return {
          data: count,
          queryCharge: 0,
        };
      }
      case "aggregate": {
        const aggCursor = coll.aggregate(query.pipeline);
        const aggResult: unknown[] = [];

        for await (const doc of aggCursor) {
          aggResult.push(doc);
        }

        return {
          data: aggResult,
          queryCharge: 0,
        };
      }
    }
  }

  /**
   * Select any documents that are hosting the given digest.
   * @param docTypeName The name of a doc type.
   * @param docStoreParams The parameters for the document store.
   */
  async selectByDigest(
    docTypeName: string,
    partition: string,
    digest: string,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const coll = this.getCollection(docStoreParams);

    const findCursor = coll.find({
      docType: docTypeName,
      partitionKey: partition,
      docDigests: {
        $in: [digest],
      },
    }, {
      limit: MAX_DOCS_TO_SELECT,
    });

    const docs: DocStoreRecord[] = [];

    for await (const doc of findCursor) {
      docs.push(this.cleanDoc(doc));
    }

    return {
      docs,
      queryCharge: 0,
    };
  }

  /**
   * Select all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param includeArchived True if the selection should include archived documents.
   * @param docStoreParams The parameters for the document store.
   */
  async selectAll(
    docTypeName: string,
    partition: string,
    includeArchived: boolean,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const coll = this.getCollection(docStoreParams);

    const query: Filter<DocStoreRecord> = {
      docType: docTypeName,
      partitionKey: partition,
    };

    if (!includeArchived) {
      query.docStatus = DocStatuses.Active;
    }

    const findCursor = coll.find(query, {
      limit: MAX_DOCS_TO_SELECT,
    });

    const docs: DocStoreRecord[] = [];

    for await (const doc of findCursor) {
      docs.push(this.cleanDoc(doc));
    }

    return {
      docs,
      queryCharge: 0,
    };
  }

  /**
   * Select documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param filter A filter expression that resulted from invoking the filter.
   * implementation on the doc type.
   * @param includeArchived True if the selection should include archived documents.
   * @param docStoreParams The parameters for the document store.
   */
  async selectByFilter(
    docTypeName: string,
    partition: string,
    filter: MongoDbDocStoreFilter,
    includeArchived: boolean,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const coll = this.getCollection(docStoreParams);

    const query: Filter<DocStoreRecord> = {
      docType: docTypeName,
      partitionKey: partition,
      ...filter.whereClause,
    };

    if (!includeArchived) {
      query.docStatus = DocStatuses.Active;
    }

    const findCursor = coll.find(query, {
      limit: filter.limit || MAX_DOCS_TO_SELECT,
      sort: filter.orderByFields
        ? filter.orderByFields.map((f) =>
          [
            f.fieldName,
            f.direction === "descending" ? "desc" : "asc",
          ] as [string, "asc" | "desc"]
        )
        : [],
    });

    const docs: DocStoreRecord[] = [];

    for await (const doc of findCursor) {
      docs.push(this.cleanDoc(doc));
    }

    return {
      docs,
      queryCharge: 0,
    };
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param ids An array of document ids.
   * @param docStoreParams The parameters for the document store.
   */
  async selectByIds(
    docTypeName: string,
    partition: string,
    ids: string[],
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const coll = this.getCollection(docStoreParams);

    const query: Filter<DocStoreRecord> = {
      docType: docTypeName,
      partitionKey: partition,
      _id: {
        $in: ids,
      },
    };

    const findCursor = coll.find(query, {
      limit: MAX_DOCS_TO_SELECT,
    });

    const docs: DocStoreRecord[] = [];

    for await (const doc of findCursor) {
      docs.push(this.cleanDoc(doc));
    }

    return {
      docs,
      queryCharge: 0,
    };
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param _docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param doc The document to store.
   * @param reqVersion The version that must be present for the upsert to succeed.
   * A null value indicates that the document should be upserted regardless.
   * @param docStoreParams The parameters for the document store.
   */
  async upsert(
    _docTypeName: string,
    partition: string,
    doc: DocStoreRecord,
    reqVersion: string | null,
    docStoreParams: MongoDbDocStoreParams,
  ): Promise<DocStoreUpsertResult> {
    const coll = this.getCollection(docStoreParams);

    const uploadableDoc = structuredClone(doc);

    uploadableDoc._id = uploadableDoc.id;
    uploadableDoc.docVersion = this.generateDocVersionFunc();
    uploadableDoc.partitionKey = partition;

    const replaceResult = await coll.replaceOne(
      reqVersion
        ? {
          _id: uploadableDoc._id as string,
          docVersion: reqVersion,
        }
        : {
          _id: uploadableDoc._id as string,
        },
      uploadableDoc,
      {
        // Generally create a new document if one does not already exist,
        // unless a value for reqVersion is specified.
        upsert: !reqVersion,
      },
    );

    if (replaceResult.upsertedCount === 1) {
      return { code: DocStoreUpsertResultCode.CREATED, sessionToken: "" };
    } else if (replaceResult.modifiedCount === 1) {
      return { code: DocStoreUpsertResultCode.REPLACED, sessionToken: "" };
    } else {
      return {
        code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
        sessionToken: "",
      };
    }
  }

  /**
   * Closes the client connection to the MongoDb server.
   */
  close() {
    return this.client.close();
  }
}
