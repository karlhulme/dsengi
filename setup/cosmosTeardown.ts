import { convertCosmosKeyToCryptoKey } from "../src/cosmosDocStore/convertCosmosKeyToCryptoKey.ts";
import { deleteDatabase } from "../src/cosmosDocStore/deleteDatabase.ts";

/**
 * Deletes the sengi database used for CI testing.
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

console.log("Deleting database.");
await deleteDatabase(cryptoKey, testCosmosUrl, "sengi");
console.log(" Done.");
