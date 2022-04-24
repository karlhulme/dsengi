import { DocRecord } from "../interfaces/index.ts";
import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";
import { cosmosRetryable } from "./cosmosRetryable.ts";
import { handleCosmosTransitoryErrors } from "./handleCosmosTransitoryErrors.ts";
import { formatPartitionKeyValue } from "./formatPartitionKeyValue.ts";

export async function getDocument(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  documentId: string,
  documentPartitionKeyValue: string | number,
): Promise<DocRecord> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "GET",
    resourceType: "docs",
    resourceLink: `dbs/${databaseName}/colls/${collectionName}/docs`,
  });

  const doc = await cosmosRetryable(async () => {
    const response = await fetch(
      `${cosmosUrl}/dbs/${databaseName}/colls/${collectionName}/docs/${documentId}`,
      {
        headers: {
          Authorization: reqHeaders.authorizationHeader,
          "x-ms-date": reqHeaders.xMsDateHeader,
          "content-type": "application/json",
          "x-ms-version": reqHeaders.xMsVersion,
          "x-ms-documentdb-partitionkey": formatPartitionKeyValue(
            documentPartitionKeyValue,
          ),
        },
      },
    );

    handleCosmosTransitoryErrors(response);

    if (!response.ok) {
      throw new Error(
        `Unable to get document ${databaseName}/${collectionName}/${documentId}.\n${await response
          .text()}`,
      );
    }

    const result = await response.json() as DocRecord;

    return result;
  });

  return doc;
}
