import {
  convertCosmosKeyToCryptoKey,
  createCollection,
  createDatabase,
  listCollections,
  listDatabases,
} from "../src/cosmosClient/index.ts";

/**
 * Adds the database and containers to the Cosmos DB instance as required for the test.
 * This script assumes that a serverless Cosmos DB instance is being used, and therefore
 * throughput requirements are not specified.
 */

const testCosmosUrl = Deno.env.get("SENGI_COSMOS_URL");

if (!testCosmosUrl) {
  throw new Error("SENGI_COSMOS_URL is not defined.");
}

const testCosmosKey = Deno.env.get("SENGI_COSMOS_KEY");

if (!testCosmosKey) {
  throw new Error("SENGI_COSMOS_KEY is not defined.");
}

console.log("Importing key.");
const cryptoKey = await convertCosmosKeyToCryptoKey(testCosmosKey);

console.log("Getting list of databases.");
const databaseIds = await listDatabases(cryptoKey, testCosmosUrl);
console.log(` Database Ids: ${databaseIds.join(", ")}`);

if (!databaseIds.includes("sengi")) {
  console.log("Create database.");
  await createDatabase(cryptoKey, testCosmosUrl, "sengi");
  console.log(" Done.");
}

console.log("Getting list of collections.");
const collectionIds = await listCollections(cryptoKey, testCosmosUrl, "sengi");
console.log(` Collection Ids: ${collectionIds.join(", ")}`);

if (!collectionIds.includes("trees")) {
  console.log("Create trees collection.");
  await createCollection(cryptoKey, testCosmosUrl, "sengi", "trees", "/id");
  console.log(" Done.");
}

if (!collectionIds.includes("treePacks")) {
  console.log("Create treePacks collection.");
  await createCollection(
    cryptoKey,
    testCosmosUrl,
    "sengi",
    "treePacks",
    "/environment",
  );
  console.log(" Done.");
}
