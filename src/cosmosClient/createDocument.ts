import { DocRecord } from "../interfaces/index.ts";
import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";
import { cosmosRetryable } from "./cosmosRetryable.ts";
import { handleCosmosTransitoryErrors } from "./handleCosmosTransitoryErrors.ts";
import { formatPartitionKeyValue } from "./formatPartitionKeyValue.ts";

interface CreateDocumentOptions {
  upsertDocument?: boolean;
}

/**
 * Returns true if a new document was created.  Returns false if an
 * existing document was replaced because the upsert option was specified.
 * In all other cases an error is raised.
 * @param cryptoKey
 * @param cosmosUrl
 * @param databaseName
 * @param collectionName
 * @param document
 * @param options
 */
export async function createDocument(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  document: DocRecord,
  documentPartitionKeyValue: string | number,
  options: CreateDocumentOptions,
): Promise<boolean> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "POST",
    resourceType: "docs",
    resourceLink: `dbs/${databaseName}/colls/${collectionName}`,
  });

  const didCreate = await cosmosRetryable(async () => {
    const optionalHeaders: Record<string, string> = {};

    if (options.upsertDocument) {
      optionalHeaders["x-ms-documentdb-is-upsert"] = "True";
    }

    const response = await fetch(
      `${cosmosUrl}/dbs/${databaseName}/colls/${collectionName}/docs`,
      {
        method: "POST",
        headers: {
          Authorization: reqHeaders.authorizationHeader,
          "x-ms-date": reqHeaders.xMsDateHeader,
          "content-type": "application/json",
          "x-ms-version": reqHeaders.xMsVersion,
          "x-ms-documentdb-partitionkey": formatPartitionKeyValue(
            documentPartitionKeyValue,
          ),
          ...optionalHeaders,
        },
        body: JSON.stringify(document),
      },
    );

    handleCosmosTransitoryErrors(response);

    if (!response.ok) {
      throw new Error(
        `Unable to create document ${databaseName}/${collectionName}/${document.id}.\n${await response
          .text()}`,
      );
    }

    await response.body?.cancel();

    return response.status === 201;
  });

  return didCreate;
}
