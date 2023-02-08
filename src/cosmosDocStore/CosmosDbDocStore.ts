/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  getDocument,
  queryDocumentsContainersDirect,
  queryDocumentsGateway,
  replaceDocument,
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
 * Defines the parameters that must be passed to the Cosmos
 * document store.
 */
export interface CosmosDbDocStoreParams {
  /**
   * The name of a Cosmos database.
   */
  databaseName: string;

  /**
   * The name of a Cosmos collection.
   */
  collectionName: string;

  /**
   * An optional session token, returned by
   * a previous write operation.
   */
  sessionToken?: string;
}

/**
 * Represents a parameter in a Cosmos SQL statement or clause.
 */
export interface CosmosDbDocStoreQueryParameter {
  /**
   * The name of a parameter in the sqlStatement that should
   * be prefixed with an @ symbol.
   */
  name: string;

  /**
   * The value to use where the parameter appears in the sqlStatement.
   */
  value: unknown;
}

/**
 * Represents a filter that can be processed by cosmosdb.
 */
export interface CosmosDbDocStoreFilter {
  /**
   * The WHERE clause of a cosmos SQL statement, that completes the phrase
   * SELECT d.* FROM docs d WHERE <filter>.  Note that any referenced
   * field names should also be prefixed with "d.".  You can use parameters
   * by prefixing with an @ symbol.  The actual field selection list will reflect
   * the requested fields.
   */
  whereClause?: string;

  /**
   * An array of parameter values that are to be substituted into
   * the where clause.
   */
  parameters?: CosmosDbDocStoreQueryParameter[];

  /**
   * An array of fields to sort by.
   * Cosmos only supports ordering by fields that are included
   * in an index.  To order on multiple fields, there will need
   * to be a corresponding composite index.
   */
  orderByFields?: CosmosDbDocStoreFilterOrderByField[];

  /**
   * The maximum number of documents to return.
   */
  limit?: number;
}

/**
 * Represents a field that is used to order the results of a query.
 */
export interface CosmosDbDocStoreFilterOrderByField {
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
 * Represents a query that can be executed against a document collection
 * which potentially operates across multiple partitions.
 */
export interface CosmosDbDocStoreQuery {
  /**
   * A complete query statement such as SELECT * FROM Docs d WHERE d.region = @region.
   */
  queryStatement: string;

  /**
   * An array of parameters to be substituted into the given query statement.
   */
  parameters: CosmosDbDocStoreQueryParameter[];

  /**
   * Queries are executed across all logical containers and the array of values
   * returned by each logical container are then combined.  This property
   * dictates how these arrays of results are combined.
   */
  transform: "concatArrays" | "sum";
}

/**
 * Represents the result of a query executed against a document collection.
 */
export interface CosmosDbDocStoreQueryResult {
  /**
   * If populated, contains the result of an executed sql command.
   */
  docs?: DocStoreRecord[];
}

/**
 * The parameters for constructing a CosmosDbDocStore.
 */
interface CosmosDbDocStoreConstructorProps {
  /**
   * The url of the cosmos instance.
   */
  cosmosUrl: string;

  /**
   * The key that grants read and write access.
   * This string key will be converted to a CryptoKey instance the first
   * time the store needs to communicate with Cosmos.
   */
  cosmosKey: string;
}

/**
 * A document store implementation for Microsoft's Azure Cosmos DB.
 */
export class CosmosDbDocStore implements
  DocStore<
    CosmosDbDocStoreParams,
    CosmosDbDocStoreFilter,
    CosmosDbDocStoreQuery
  > {
  collectionsPartitionKeyCache: Record<string, string> = {};
  cosmosUrl: string;
  cosmosKey: string;
  cryptoKey: CryptoKey | null;

  /**
   * Returns a select query based on the given inputs.
   * @param includeArchived True if archived documents should be included in the result.
   * @param whereClause A Cosmos WHERE clause.
   * @param orderByFields An array of fields that will appear in the ORDER BY clause.
   * @param limit The maximum number of documents to select.
   */
  private buildSelectCommand(
    includeArchived?: boolean,
    whereClause?: string,
    orderByFields?: CosmosDbDocStoreFilterOrderByField[],
    limit?: number,
  ): string {
    // Determine the top/limit.
    const top = limit && limit < MAX_DOCS_TO_SELECT
      ? limit
      : MAX_DOCS_TO_SELECT;

    // Determine the select, from and initial where clauses.
    let sql = `
      SELECT TOP ${top} *
      FROM Docs d
      WHERE d.partitionKey = @partitionKey
        AND d.docType = @docType
    `;

    // Determine if we're only including live documents.
    if (!includeArchived) {
      sql += `  AND d.docStatus = "${DocStatuses.Active}"`;
    }

    // Determine the additional where clause if required.
    if (typeof whereClause === "string") {
      sql += `  AND (${whereClause})`;
    }

    // Determine the order by clause.
    if (Array.isArray(orderByFields) && orderByFields.length > 0) {
      const orderSnippets = orderByFields.map((f) =>
        `d.${f.fieldName} ${f.direction === "descending" ? "DESC" : "ASC"}`
      );
      sql += ` ORDER BY ${orderSnippets.join(", ")}`;
    }

    return sql;
  }

  /**
   * Return a new document with the Cosmos internal fields
   * removed and the _etag copied to the docVersion field.
   * @param doc A document retrieved from a Cosmos database.
   */
  private cleanDoc(doc: Record<string, unknown>) {
    const { _rid, _ts, _self, _etag, _attachments, ...others } = doc;

    return {
      ...others,
      docVersion: (_etag as string).replaceAll('"', ""),
    };
  }

  /**
   * Ensures the cosmos key has been converted to a crypto key
   * that can be passed to the Cosmos store.
   */
  private async ensureCryptoKey() {
    if (this.cryptoKey === null) {
      this.cryptoKey = await convertCosmosKeyToCryptoKey(this.cosmosKey);
    }
  }

  /**
   * Constructs a new instance of the document store.
   * @param props The constructor properties.
   */
  constructor(props: CosmosDbDocStoreConstructorProps) {
    this.cosmosUrl = props.cosmosUrl;
    this.cosmosKey = props.cosmosKey;
    this.cryptoKey = null;
  }

  /**
   * Delete a single document from the store using it's id.
   * @param _docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param docStoreParams The parameters for the document store.
   */
  async deleteById(
    _docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreDeleteByIdResult> {
    await this.ensureCryptoKey();

    const deleteDocResult = await deleteDocument(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      id,
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    const resultCode = deleteDocResult.didDelete
      ? DocStoreDeleteByIdResultCode.DELETED
      : DocStoreDeleteByIdResultCode.NOT_FOUND;

    return {
      code: resultCode,
      sessionToken: deleteDocResult.sessionToken,
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
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreExistsResult> {
    await this.ensureCryptoKey();

    const gatewayResult = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      `SELECT VALUE COUNT(1)
      FROM Docs d
      WHERE d.partitionKey = @partitionKey AND
        d.docType = @docType AND
        d.id = @id`,
      [
        { name: "@partitionKey", value: partition },
        { name: "@docType", value: docTypeName },
        { name: "@id", value: id },
      ],
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    // Usually queryDocuments returns an array of documents, but using
    // the VALUE COUNT(1) syntax we retrieve a scalar value.
    const scalars = gatewayResult.records as unknown as number[];

    return { found: scalars[0] === 1 };
  }

  /**
   * Fetch a single document using it's id.
   * If the partition key for the collection is the id field then the
   * document will be fetched via id, otherwise a cross-partition
   * query will be used.
   * @param docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param id The id of a document.
   * @param docStoreParams The parameters for the document store.
   */
  async fetch(
    docTypeName: string,
    partition: string,
    id: string,
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreFetchResult> {
    await this.ensureCryptoKey();

    const getDocumentResult = await getDocument(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      id,
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    let doc = null;

    if (
      getDocumentResult && getDocumentResult.doc &&
      getDocumentResult.doc.docType === docTypeName
    ) {
      doc = this.cleanDoc(getDocumentResult.doc);
    }

    return { doc };
  }

  /**
   * Execute a query against the document store.
   * @param _docTypeName The name of a doc type.
   * @param query A query to execute that should include a clause for
   * a specific partition.
   * @param docStoreParams The parameters for the document store.
   */
  async query(
    _docTypeName: string,
    query: CosmosDbDocStoreQuery,
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreQueryResult> {
    await this.ensureCryptoKey();

    const containerDirectResult = await queryDocumentsContainersDirect(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      query.queryStatement,
      query.parameters,
      query.transform,
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    return {
      data: containerDirectResult.data,
      queryCharge: containerDirectResult.requestCharge,
    };
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
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    await this.ensureCryptoKey();

    const selectCmd = this.buildSelectCommand(
      true,
      "ARRAY_CONTAINS(d.docDigests, @digest)",
      undefined,
      1,
    );

    const gatewayResult = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      selectCmd,
      [
        { name: "@partitionKey", value: partition },
        { name: "@docType", value: docTypeName },
        { name: "@digest", value: digest },
      ],
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    return {
      docs: gatewayResult.records.map(this.cleanDoc),
      queryCharge: gatewayResult.requestCharge,
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
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const queryCmd = this.buildSelectCommand(includeArchived);

    await this.ensureCryptoKey();

    const gatewayResult = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      queryCmd,
      [
        { name: "@partitionKey", value: partition },
        { name: "@docType", value: docTypeName },
      ],
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    return {
      docs: gatewayResult.records.map(this.cleanDoc),
      queryCharge: gatewayResult.requestCharge,
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
    filter: CosmosDbDocStoreFilter,
    includeArchived: boolean,
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const queryCmd = this.buildSelectCommand(
      includeArchived,
      filter.whereClause,
      filter.orderByFields,
      filter.limit,
    );

    await this.ensureCryptoKey();

    const gatewayResult = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      queryCmd,
      [
        { name: "@partitionKey", value: partition },
        { name: "@docType", value: docTypeName },
        ...(filter.parameters || []),
      ],
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    return {
      docs: gatewayResult.records.map(this.cleanDoc),
      queryCharge: gatewayResult.requestCharge,
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
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreSelectResult> {
    const whereClause = `d.id IN (${ids.map((i) => `"${i}"`).join(", ")})`;

    const queryCmd = this.buildSelectCommand(true, whereClause);

    await this.ensureCryptoKey();

    const gatewayResult = await queryDocumentsGateway(
      this.cryptoKey as CryptoKey,
      this.cosmosUrl,
      docStoreParams.databaseName,
      docStoreParams.collectionName,
      partition,
      queryCmd,
      [
        { name: "@partitionKey", value: partition },
        { name: "@docType", value: docTypeName },
      ],
      {
        sessionToken: docStoreParams.sessionToken,
      },
    );

    return {
      docs: gatewayResult.records.map(this.cleanDoc),
      queryCharge: gatewayResult.requestCharge,
    };
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * Documents passed to this function are guaranteed to have an id property.
   * @param _docTypeName The name of a doc type.
   * @param partition The name of a partition where documents are stored.
   * @param doc The document to store.
   * @param docStoreParams The parameters for the document store.
   */
  async upsert(
    _docTypeName: string,
    partition: string,
    doc: DocStoreRecord,
    reqVersion: string | null,
    docStoreParams: CosmosDbDocStoreParams,
  ): Promise<DocStoreUpsertResult> {
    const uploadableDoc = structuredClone(doc);

    if (typeof uploadableDoc.docVersion !== "undefined") {
      delete uploadableDoc.docVersion;
    }

    await this.ensureCryptoKey();

    if (reqVersion) {
      const replaceDocumentResult = await replaceDocument(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        docStoreParams.databaseName,
        docStoreParams.collectionName,
        partition,
        uploadableDoc,
        {
          ifMatch: reqVersion,
          sessionToken: docStoreParams.sessionToken,
        },
      );

      const resultCode = replaceDocumentResult.didReplace
        ? DocStoreUpsertResultCode.REPLACED
        : DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE;

      return {
        code: resultCode,
        sessionToken: replaceDocumentResult.sessionToken,
      };
    } else {
      const createDocumentResult = await createDocument(
        this.cryptoKey as CryptoKey,
        this.cosmosUrl,
        docStoreParams.databaseName,
        docStoreParams.collectionName,
        partition,
        uploadableDoc,
        {
          upsertDocument: true,
          sessionToken: docStoreParams.sessionToken,
        },
      );

      const resultCode = createDocumentResult.didCreate
        ? DocStoreUpsertResultCode.CREATED
        : DocStoreUpsertResultCode.REPLACED;

      return {
        code: resultCode,
        sessionToken: createDocumentResult.sessionToken,
      };
    }
  }
}
