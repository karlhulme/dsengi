import { convertCosmosKeyToCryptoKey, deleteDatabase } from "../deps.ts";

/**
 * Deletes the sengi database used for CI testing.
 */

const testCosmosUrl = Deno.env.get("COSMOS_URL");

if (!testCosmosUrl) {
  throw new Error("COSMOS_URL is not defined.");
}

const testCosmosKey = Deno.env.get("COSMOS_KEY");

if (!testCosmosKey) {
  throw new Error("COSMOS_KEY is not defined.");
}

console.log("Importing key.");
const cryptoKey = await convertCosmosKeyToCryptoKey(testCosmosKey);

console.log("Deleting database.");
await deleteDatabase(cryptoKey, testCosmosUrl, "sengi");
console.log(" Done.");
