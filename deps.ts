export {
  assert,
  assertEquals,
  assertExists,
  assertIsError,
  assertNotEquals,
  assertObjectMatch,
  assertRejects,
  assertStrictEquals,
  assertThrows,
  fail,
} from "https://deno.land/std@0.156.0/testing/asserts.ts";

export {
  decode as decodeBase64,
  encode as encodeBase64,
} from "https://deno.land/std@0.156.0/encoding/base64.ts";

export { match, spy } from "https://cdn.skypack.dev/sinon@v15.0.1?dts";

export {
  OperationTransitoryError,
  retryable,
} from "https://raw.githubusercontent.com/karlhulme/dpiggle/main/mod.ts";

export {
  convertCosmosKeyToCryptoKey,
  createCollection,
  createDatabase,
  createDocument,
  deleteDatabase,
  deleteDocument,
  getDocument,
  listCollections,
  listDatabases,
  queryDocumentsContainersDirect,
  queryDocumentsGateway,
  replaceDocument,
} from "https://raw.githubusercontent.com/karlhulme/dazure-cosmos/main/mod.ts";

export { default as TtlCache } from "https://deno.land/x/ttl@1.0.1/mod.ts";
