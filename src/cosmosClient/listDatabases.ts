import { generateCosmosReqHeaders } from "./generateCosmosReqHeaders.ts";

export async function listDatabases(
  cryptoKey: CryptoKey,
  cosmosUrl: string,
): Promise<string[]> {
  const reqHeaders = await generateCosmosReqHeaders({
    key: cryptoKey,
    method: "GET",
    resourceType: "dbs",
  });

  const response = await fetch(`${cosmosUrl}/dbs`, {
    headers: {
      Authorization: reqHeaders.authorizationHeader,
      "x-ms-date": reqHeaders.xMsDateHeader,
      "content-type": "application/json",
      "x-ms-version": reqHeaders.xMsVersion,
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to list databases.\n${await response.text()}`);
  }

  const result = await response.json();

  return result.Databases.map((db: { id: string }) => db.id);
}
