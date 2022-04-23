import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";

export async function listCollections(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
  databaseName: string,
): Promise<string[]> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "GET",
    resourceType: "colls",
    resourceLink: `dbs/${databaseName}`,
  });

  const response = await fetch(`${cosmosUrl}/dbs/${databaseName}/colls`, {
    headers: {
      Authorization: reqHeaders.authorizationHeader,
      "x-ms-date": reqHeaders.xMsDateHeader,
      "content-type": "application/json",
      "x-ms-version": reqHeaders.xMsVersion,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to list collections.\n${await response.text()}`);
  }

  const result = await response.json();

  return result.DocumentCollections.map((col: { id: string }) => col.id);
}
