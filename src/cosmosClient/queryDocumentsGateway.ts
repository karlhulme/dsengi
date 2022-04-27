import { DocRecord } from "../interfaces/index.ts";
import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";
import { cosmosRetryable } from "./cosmosRetryable.ts";
import { handleCosmosTransitoryErrors } from "./handleCosmosTransitoryErrors.ts";

interface QueryDocumentsGatewayOptions {
  /**
   * True if the query should be executed across multiple
   * partitions and the results then combined.
   * This value should be set to true if the query is based
   * on anything other than a single partition key.
   */
  crossPartitionQuery?: boolean;
}

interface CosmosQueryParameter {
  /**
   * The name of a parameter, e.g. @city.
   */
  name: string;

  /**
   * The value of a parameter, e.g. "Bournemouth".
   */
  value: string;
}

export async function queryDocumentsGateway(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  query: string,
  parameters: CosmosQueryParameter[],
  options: QueryDocumentsGatewayOptions,
): Promise<DocRecord[]> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "POST",
    resourceType: "docs",
    resourceLink: `dbs/${databaseName}/colls/${collectionName}`,
  });

  const records: DocRecord[] = [];

  let continuationToken: string | null = null;
  let isAllRecordsLoaded = false;

  while (!isAllRecordsLoaded) {
    const optionalHeaders: Record<string, string> = {};

    if (continuationToken) {
      optionalHeaders["x-ms-continuation"] = continuationToken;
    }

    if (options.crossPartitionQuery) {
      optionalHeaders["x-ms-documentdb-query-enablecrosspartition"] = "True";
    }

    await cosmosRetryable(async () => {
      const response = await fetch(
        `${cosmosUrl}/dbs/${databaseName}/colls/${collectionName}/docs`,
        {
          method: "POST",
          headers: {
            Authorization: reqHeaders.authorizationHeader,
            "x-ms-date": reqHeaders.xMsDateHeader,
            "content-type": "application/query+json",
            "x-ms-version": reqHeaders.xMsVersion,
            ...optionalHeaders,
          },
          body: JSON.stringify({
            query,
            parameters,
          }),
        },
      );

      handleCosmosTransitoryErrors(response);

      if (!response.ok) {
        const errMsg =
          `Unable to query collection ${databaseName}/${collectionName} with query ${query} and parameters ${
            JSON.stringify(parameters)
          }.\n${await response.text()}`;

        throw new Error(errMsg);
      }

      continuationToken = response.headers.get("x-ms-continuation");

      if (!continuationToken) {
        isAllRecordsLoaded = true;
      }

      const result = await response.json();

      records.push(...result.Documents);
    });
  }

  return records;
}
