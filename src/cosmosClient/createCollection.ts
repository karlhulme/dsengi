import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";

export async function createCollection(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
  collectionName: string,
  partitionKey: string,
) {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "POST",
    resourceType: "colls",
    resourceLink: `dbs/${databaseName}`,
  });

  const response = await fetch(`${cosmosUrl}/dbs/${databaseName}/colls`, {
    method: "POST",
    headers: {
      Authorization: reqHeaders.authorizationHeader,
      "x-ms-date": reqHeaders.xMsDateHeader,
      "content-type": "application/json",
      "x-ms-version": reqHeaders.xMsVersion,
    },
    body: JSON.stringify({
      id: collectionName,
      partitionKey: {
        paths: [
          partitionKey,
        ],
        kind: "Hash",
        Version: 2,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to create collection.\n${await response.text()}`);
  }
}
