import { DocRecord } from "../interfaces/index.ts";
import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";
import { cosmosRetryable } from "./cosmosRetryable.ts";
import { handleCosmosTransitoryErrors } from "./handleCosmosTransitoryErrors.ts";
import { formatPartitionKeyValue } from "./formatPartitionKeyValue.ts";

interface ReplaceDocumentOptions {
  ifMatch?: string;
}

/**
 * Returns true if the document was successfully replaced.  Returns false
 * of the specified version is not found and the document is not replaced.
 * In all other cases an error is raised.
 * @param cryptoKey
 * @param cosmosUrl
 * @param databaseName
 * @param collectionName
 * @param document
 * @param options
 * @returns
 */
export async function replaceDocument(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  document: DocRecord,
  documentPartitionKeyValue: string | number,
  options: ReplaceDocumentOptions,
): Promise<boolean> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "PUT",
    resourceType: "docs",
    resourceLink: `dbs/${databaseName}/colls/${collectionName}/docs`,
  });

  const didReplace = await cosmosRetryable(async () => {
    const optionalHeaders: Record<string, string> = {};

    if (options.ifMatch) {
      optionalHeaders["If-Match"] = options.ifMatch;
    }

    const response = await fetch(
      `${cosmosUrl}/dbs/${databaseName}/colls/${collectionName}/docs/${document.id}`,
      {
        method: "PUT",
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

    if (!response.ok && response.status !== 412) {
      throw new Error(
        `Unable to replace document ${databaseName}/${collectionName}/${document.id}.\n${await response
          .text()}`,
      );
    }

    await response.body?.cancel();

    return response.ok;
  });

  return didReplace;
}
