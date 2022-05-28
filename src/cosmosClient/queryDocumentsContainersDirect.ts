import { DocRecord } from "../interfaces/index.ts";
import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";
import { cosmosRetryable } from "./cosmosRetryable.ts";
import { handleCosmosTransitoryErrors } from "./handleCosmosTransitoryErrors.ts";

interface QueryDocumentsDirectOptions {
  /**
   * If the query includes SUM, AVG, COUNT, OFFSET, LIMIT or ORDER BY then
   * the gateway cannot process the query and we need to
   * execute the query on each of the containers individually.
   * As a result, we may retrieve more results that the client would like.
   * To bypass the gateway, provide a transform function that will convert
   * the combined results of the queries into an array to be returned
   * to the client.  By providing this function, cosmos will be queried
   * first for the applicable pkranges and then queried again for the results
   * from each container.
   */
  transform: (docs: DocRecord[]) => DocRecord[];
}

interface CosmosQueryParameter {
  /**
   * The name of a parameter, e.g. @city.
   */
  name: string;

  /**
   * The value of a parameter, e.g. "Bournemouth".
   */
  value: unknown;
}

export async function queryDocumentsContainersDirect(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  query: string,
  parameters: CosmosQueryParameter[],
  options: QueryDocumentsDirectOptions,
): Promise<DocRecord[]> {
  // Retrieve the pk ranges for the collection.  This can change at
  // any time so we perform this lookup on each query.
  // There is potential performance uplift by only doing this once
  // and then responding to errors informing us that the given range
  // has changed.
  const pkRanges = await getPkRangesForContainer(
    cryptoKey,
    cosmosUrl,
    databaseName,
    collectionName,
  );

  /**
   * Then request the documents from all of the physical partitions
   * simultaenously.  For a small number of physical partitions it's fine
   * to do this, but we may have to throttle the requests if
   * the number of physical partitions is larger.  Note that this will
   * require a cross-partition (i.e. logical partitions) query.
   */
  const promises = pkRanges.map((pkr) =>
    getDocumentsForPkRange(
      cryptoKey,
      cosmosUrl,
      databaseName,
      collectionName,
      pkr,
      query,
      parameters,
      options,
    )
  );

  const recordsArray = await Promise.all(promises);

  // Combine the arrays.  Using push may be faster than concat:
  // https://dev.to/uilicious/javascript-array-push-is-945x-faster-than-array-concat-1oki
  const records = recordsArray.reduce((agg, cur) => {
    agg.push(...cur);
    return agg;
  }, []);

  const transformedRecords = options.transform(records);

  return transformedRecords;
}

async function getPkRangesForContainer(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
) {
  const pkRangesReqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "GET",
    resourceType: "pkranges",
    resourceLink: `dbs/${databaseName}/colls/${collectionName}`,
  });

  const pkRanges = await cosmosRetryable(async () => {
    const response = await fetch(
      `${cosmosUrl}/dbs/${databaseName}/colls/${collectionName}/pkranges`,
      {
        method: "GET",
        headers: {
          Authorization: pkRangesReqHeaders.authorizationHeader,
          "x-ms-date": pkRangesReqHeaders.xMsDateHeader,
          "x-ms-version": pkRangesReqHeaders.xMsVersion,
        },
      },
    );

    handleCosmosTransitoryErrors(response);

    if (!response.ok) {
      const errMsg =
        `Unable to get pk-ranges from collection ${databaseName}/${collectionName}.\n${await response
          .text()}`;

      throw new Error(errMsg);
    }

    const pkRangesFull = await response.json() as {
      _rid: string;
      PartitionKeyRanges: { id: string }[];
    };

    return pkRangesFull.PartitionKeyRanges.map((pkr) =>
      `${pkRangesFull._rid},${pkr.id}`
    );
  });

  return pkRanges;
}

async function getDocumentsForPkRange(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  pkRange: string,
  query: string,
  parameters: CosmosQueryParameter[],
  _options: QueryDocumentsDirectOptions,
) {
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
            "x-ms-documentdb-partitionkeyrangeid": pkRange,
            "x-ms-documentdb-query-enablecrosspartition": "True",
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
          `Unable to query collection (container-direct-mode) ${databaseName}/${collectionName}/${pkRange} with query ${query} and parameters ${
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
