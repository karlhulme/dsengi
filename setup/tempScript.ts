import {
  convertCosmosKeyToCryptoKey,
  createCollection,
  createDocument,
  listCollections,
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

console.log("Getting list of collections.");
const collectionIds = await listCollections(cryptoKey, testCosmosUrl, "sengi");
console.log(` Collection Ids: ${collectionIds.join(", ")}`);

if (!collectionIds.includes("temp")) {
  console.log("Create temp collection.");
  await createCollection(cryptoKey, testCosmosUrl, "sengi", "temp");
  console.log(" Done.");
}

for (let i = 0; i < 10000; i++) {
  await createDocument(
    cryptoKey,
    testCosmosUrl,
    "sengi",
    "temp",
    "_central",
    {
      id: crypto.randomUUID(),
      a: Math.random(),
      b: crypto.randomUUID(),
      c: [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
      ],
    },
    {},
  );

  if (i % 100 === 0) {
    console.log(`Created ${i} docs.`);
  }
}

console.log(" Done.");
