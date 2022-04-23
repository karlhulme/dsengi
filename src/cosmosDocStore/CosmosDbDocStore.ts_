/* eslint-disable @typescript-eslint/no-unused-vars */
import { CosmosClient, FeedResponse, RequestOptions } from  '@azure/cosmos'
import { 
  DocRecord,
  DocStore, DocStoreDeleteByIdProps, DocStoreDeleteByIdResult,
  DocStoreDeleteByIdResultCode, DocStoreExistsProps, DocStoreExistsResult,
  DocStoreFetchProps, DocStoreFetchResult, DocStoreQueryProps,
  DocStoreQueryResult, DocStoreSelectProps, DocStoreSelectResult,
  DocStoreUpsertProps, DocStoreUpsertResult, DocStoreUpsertResultCode,
  UnexpectedDocStoreError
} from 'sengi-interfaces'

/**
 * Represents the options that can be passed to the cosmosdb store.
 */
 export type CosmosDbDocStoreOptions = Record<string, unknown>

/**
 * Represents a filter that can be processed by cosmosdb. 
 */
export interface CosmosDbDocStoreFilter {
  /**
   * The WHERE clause of a cosmos SQL statement, that completes the phrase
   * SELECT d.* FROM docs d WHERE <filter>.
   */
  whereClause: string
}

/**
 * Represents a query that can be executed against a document collection.
 */
export interface CosmosDbDocStoreQuery {
  /**
   * If populated, executes the given SQL directly against the collection.
   */
  sqlQuery?: string
}

/**
 * Represents the result of a query executed against a document collection.
 */
export interface CosmosDbDocStoreQueryResult {
  /**
   * If populated, contains the result of an executed sql command.
   */
  sqlQueryResult?: FeedResponse<DocRecord>
}

/**
 * The parameters for constructing a MemDocStore.
 */
interface CosmosDbDocStoreConstructorProps {
  /**
   * The url of the cosmos instance.
   */
  cosmosUrl: string

  /**
   * The key that grants read and write access.
   */
  cosmosKey: string

  /**
   * A function that names the database that contains documents identified by the given docTypeName or docTypePluralName.
   */
  getDatabaseNameFunc: (docTypeName: string, docTypePluralName: string, options: CosmosDbDocStoreOptions) => string

  /**
   * A function that names the container that contains documents identified by the given docTypeName or docTypePluralName.
   */
  getContainerNameFunc: (databaseName: string, docTypeName: string, docTypePluralName: string, options: CosmosDbDocStoreOptions) => string

  /**
   * A function that returns the singular value of the partition key for the container that contains
   * documents identified by the given docTypeName or docTypePluralName.
   * For authoritative documents, with a /id partition key, this function should return the id parameter, which
   * is the fifth parameter passed to the method.
   * For warehouse documents, this function should return null.  This connector will then look up the partition key
   * and the corresponding value on the document to be processed.  Using a container name suffix is a useful way
   * of identifying warehouse documents.
   */
  getPartitionKeyFunc: (databaseName: string, containerName: string, docTypeName: string, docTypePluralName: string, id: string, options: CosmosDbDocStoreOptions) => string|null
}

/**
 * An document store implementation for Microsoft's Azure Cosmos DB.
 */
export class CosmosDbDocStore implements DocStore<CosmosDbDocStoreOptions, CosmosDbDocStoreFilter, CosmosDbDocStoreQuery, CosmosDbDocStoreQueryResult> {
  cosmosUrl: string
  cosmosKey: string
  getDatabaseNameFunc: (docTypeName: string, docTypePluralName: string, options: CosmosDbDocStoreOptions) => string
  getContainerNameFunc: (databaseName: string, docTypeName: string, docTypePluralName: string, options: CosmosDbDocStoreOptions) => string
  getPartitionKeyFunc: (databaseName: string, containerName: string, docTypeName: string, docTypePluralName: string, id: string, options: CosmosDbDocStoreOptions) => string|null
  cosmosClient: CosmosClient

  /**
   * Returns the value of the partition key field for a document with the given id.
   * @param databaseName The name of a database.
   * @param containerName The name of a container.
   * @param id The id of a document.
   */
  private async getPartitionKeyValueForDocument (databaseName: string, containerName: string, id: string): Promise<string> {
    const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)

    const partitionKeyName = await cosmosContainer.readPartitionKeyDefinition()

    // istanbul ignore next - all containers have a partition key (legacy ones did not)
    const fieldName = partitionKeyName.resource?.paths[0].substring(1) || 'missing_partition_key'

    const queryCmd = `
      SELECT d.${fieldName}
      FROM Docs d
      WHERE d.id = @id
    `

    const result = await cosmosContainer.items.query({
      query: queryCmd,
      parameters: [
        { name: '@id', value: id }
      ]
    }).fetchAll()

    return result.resources[0][fieldName]
  }

  /**
   * Returns a select query based on the given inputs.
   * @param fieldNames An array of field names.
   * @param limit The maximum number of documents to retrieve.
   * @param offset The number of documents to skip before retrieving documents.
   * @param whereClause A Cosmos WHERE clause.
   */
  private buildSelectCommand (fieldNames: string[], limit?: number, offset?: number, whereClause?: string): string {
    // the select and from clauses, plus the basic where clause
    let sql = `
      SELECT d._etag ${fieldNames.map(f => `, d.${f}`).join('')}
      FROM Docs d
    `

    // the detailed where clause
    if (typeof whereClause === 'string') {
      sql += `  WHERE (${whereClause})`
    }

    // the limit and offset clauses
    if (limit && limit > 0 && offset && offset > 0) {
      sql += `  OFFSET ${offset} LIMIT ${limit}`
    } else if (limit && limit > 0) {
      sql += `  OFFSET 0 LIMIT ${limit}`
    }

    return sql
  }

  /**
   * Return a new array of docs whereby each document
   * only contains the fields in the given fieldNames array.
   * @param {Array} docs An array of docs.
   * @param {Array} fieldNames An array of field names.
   */
  private buildResultDocs (docs: DocRecord[], fieldNames: string[]) {
    const results: DocRecord[] = []

    for (let i = 0; i < docs.length; i++) {
      const result: DocRecord = {}

      for (const fieldName of fieldNames) {
        if (fieldName === 'docVersion') {
          result[fieldName] = docs[i]._etag
        } else {
          result[fieldName] = docs[i][fieldName]
        }
      }

      results.push(result)
    }

    return results
  }

  /**
   * Creates a new document using the keys of the given doc
   * bypassing any properties named in the given omitKeys array.
   * @param doc A document.
   * @param omitKeys An array of property keys.
   */
  private createSubsetOfDocument (doc: DocRecord, fieldNamesToOmit: string[]) {
    return Object.keys(doc).reduce((result: DocRecord, key: string) => {
      if (!fieldNamesToOmit.includes(key)) {
        result[key] = doc[key]
      }

      return result
    }, {})
  }

  /**
   * Constructs a new instance of the in-memory document store.
   * @param props The constructor properties.
   */
  constructor (props: CosmosDbDocStoreConstructorProps) {
    this.cosmosUrl = props.cosmosUrl
    this.cosmosKey = props.cosmosKey
    this.getDatabaseNameFunc = props.getDatabaseNameFunc
    this.getContainerNameFunc = props.getContainerNameFunc
    this.getPartitionKeyFunc = props.getPartitionKeyFunc

    this.cosmosClient = new CosmosClient({
      endpoint: this.cosmosUrl,
      key: this.cosmosKey
    })
  }

  /**
   * Delete a single document from the store using it's id.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async deleteById (docTypeName: string, docTypePluralName: string, id: string, options: CosmosDbDocStoreOptions, props: DocStoreDeleteByIdProps): Promise<DocStoreDeleteByIdResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
      let partitionKeyValue = this.getPartitionKeyFunc(databaseName, containerName, docTypeName, docTypePluralName, id, options)
  
      if (!partitionKeyValue) {
        partitionKeyValue = await this.getPartitionKeyValueForDocument(databaseName, containerName, id)
      }

      const cosmosItem = this.cosmosClient.database(databaseName).container(containerName).item(id, partitionKeyValue)
  
      await cosmosItem.delete()
      return { code: DocStoreDeleteByIdResultCode.DELETED }
    } catch (err) {
      // istanbul ignore next - cannot produce the else branch
      if ((err as { code: number }).code === 404) {
        return { code: DocStoreDeleteByIdResultCode.NOT_FOUND }
      } else {
        throw new UnexpectedDocStoreError('Cosmos database error processing \'deleteById\'.', err as Error)
      }
    }
  }

  /**
   * Determines if a document with the given id is in the datastore.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async exists (docTypeName: string, docTypePluralName: string, id: string, options: CosmosDbDocStoreOptions, props: DocStoreExistsProps): Promise<DocStoreExistsResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
    
      const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
    
      const queryCmd = `
        SELECT VALUE COUNT(1)
        FROM Docs d
        WHERE d.id = @id
      `
  
      // cross-platform queries are enabled as standard
      const result = await cosmosContainer.items.query({
        query: queryCmd,
        parameters: [
          { name: '@id', value: id }
        ]
      }).fetchAll()
  
      return { found: result.resources[0] === 1 }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'exists\'.', err as Error)
    }
  }

  /**
   * Fetch a single document using it's id.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param id The id of a document.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async fetch (docTypeName: string, docTypePluralName: string, id: string, options: CosmosDbDocStoreOptions, props: DocStoreFetchProps): Promise<DocStoreFetchResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
      let partitionKeyValue = this.getPartitionKeyFunc(databaseName, containerName, docTypeName, docTypePluralName, id, options)  

      if (!partitionKeyValue) {
        partitionKeyValue = await this.getPartitionKeyValueForDocument(databaseName, containerName, id)
      }

      const cosmosItem = this.cosmosClient.database(databaseName).container(containerName).item(id, partitionKeyValue)

      const result = await cosmosItem.read()
  
      let doc = null

      if (result.resource && result.resource.docType === docTypeName) {
        const { _rid, _ts, _self, _etag, _attachments, ...others } = result.resource
        doc = { ...others, docVersion: _etag }
      }
  
      return { doc }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'fetch\'.', err as Error)
    }
  }

  /**
   * Execute a query against the document store.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param query A query to execute.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
   async query (docTypeName: string, docTypePluralName: string, query: CosmosDbDocStoreQuery, options: CosmosDbDocStoreOptions, props: DocStoreQueryProps): Promise<DocStoreQueryResult<CosmosDbDocStoreQueryResult>> {
    try {
      if (query.sqlQuery) {
        const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
        const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)

        const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
        
        const result = await cosmosContainer.items.query({ query: query.sqlQuery }).fetchAll()

        return { data: { sqlQueryResult: result } }
      } else {
        return { data: {} }
      }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'query\'.', err as Error)
    }
  }

  /**
   * Select all documents of a specified type.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param fieldNames An array of field names to include in the response.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectAll (docTypeName: string, docTypePluralName: string, fieldNames: string[], options: CosmosDbDocStoreOptions, props: DocStoreSelectProps): Promise<DocStoreSelectResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
    
      const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
    
      const queryCmd = this.buildSelectCommand(fieldNames, props.limit, props.offset)
    
      const result = await cosmosContainer.items.query({ query: queryCmd }).fetchAll()
  
      return { docs: this.buildResultDocs(result.resources, fieldNames) }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'queryAll\'.', err as Error)
    }
  }

  /**
   * Select documents of a specified type that also match a filter.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param fieldNames An array of field names to include in the response.
   * @param filterExpression A filter expression that resulted from invoking the filter.
   * implementation on the doc type.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectByFilter (docTypeName: string, docTypePluralName: string, fieldNames: string[], filter: CosmosDbDocStoreFilter, options: CosmosDbDocStoreOptions, props: DocStoreSelectProps): Promise<DocStoreSelectResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
    
      const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
    
      const queryCmd = this.buildSelectCommand(fieldNames, props.limit, props.offset, filter.whereClause)
  
      const result = await cosmosContainer.items.query({ query: queryCmd }).fetchAll()
  
      return { docs: this.buildResultDocs(result.resources, fieldNames) }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'queryAll\'.', err as Error)
    }
  }

  /**
   * Select documents of a specified type that also have one of the given ids.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param fieldNames An array of field names to include in the response.
   * @param ids An array of document ids.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async selectByIds (docTypeName: string, docTypePluralName: string, fieldNames: string[], ids: string[], options: CosmosDbDocStoreOptions, props: DocStoreSelectProps): Promise<DocStoreSelectResult> {
    try {
      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
    
      const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
    
      const whereClauses = `d.id IN (${ids.map(i => `"${i}"`).join(', ')})`

      const queryCmd = this.buildSelectCommand(fieldNames, props.limit, props.offset, whereClauses as string)
    
      const result = await cosmosContainer.items.query({ query: queryCmd }).fetchAll()
  
      return { docs: this.buildResultDocs(result.resources, fieldNames) }
    } catch (err) {
      // istanbul ignore next
      throw new UnexpectedDocStoreError('Cosmos database error processing \'queryAll\'.', err as Error)
    }
  }

  /**
   * Store a single document in the store, overwriting an existing if necessary.
   * @param docTypeName The name of a doc type.
   * @param docTypePluralName The plural name of a doc type.
   * @param doc The document to store.
   * @param options A set of options supplied with the original request
   * and options defined on the document type.
   * @param props Properties that define how to carry out this action.
   */
  async upsert (docTypeName: string, docTypePluralName: string, doc: DocRecord, options: CosmosDbDocStoreOptions, props: DocStoreUpsertProps): Promise<DocStoreUpsertResult> {
    try {
      const cleanDoc = this.createSubsetOfDocument(doc, ['docVersion', '_attachments', '_etag', '_ts'])

      const databaseName = this.getDatabaseNameFunc(docTypeName, docTypePluralName, options)
      const containerName = this.getContainerNameFunc(databaseName, docTypeName, docTypePluralName, options)
    
      const cosmosContainer = this.cosmosClient.database(databaseName).container(containerName)
    
      const upsertOptions: RequestOptions = {}
    
      if (props.reqVersion) {
        upsertOptions.accessCondition = { type: 'IfMatch', condition: props.reqVersion }
      }
  
      const result = await cosmosContainer.items.upsert(cleanDoc, upsertOptions)
  
      return {
        code: result.statusCode === 201
          ? DocStoreUpsertResultCode.CREATED
          : DocStoreUpsertResultCode.REPLACED
      }
    } catch (err) {
      // istanbul ignore next - cannot produce the else branch
      if ((err as { code: number }).code === 412) {
        return { code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE }
      } else {
        throw new UnexpectedDocStoreError('Cosmos database error processing \'upsert\'.', err as Error)
      }
    }
  }
}
