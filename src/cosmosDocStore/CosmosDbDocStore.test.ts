import { assertEquals, assertObjectMatch } from "../../deps.ts";
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  queryDocumentsContainersDirect,
} from "../cosmosClient/index.ts";
import {
  DocStoreDeleteByIdResultCode,
  DocStoreRecord,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";
import { CosmosDbDocStore } from "./CosmosDbDocStore.ts";

const TestPartition = "testPartition";

const TEST_COSMOS_URL = Deno.env.get("SENGI_COSMOS_URL") || "";
const TEST_COSMOS_KEY = Deno.env.get("SENGI_COSMOS_KEY") || "";

function createCosmosDbDocStore(): CosmosDbDocStore {
  return new CosmosDbDocStore({
    cosmosUrl: TEST_COSMOS_URL,
    cosmosKey: TEST_COSMOS_KEY,
  });
}

async function initDb(): Promise<void> {
  const MAX_ITEMS_TO_DELETE = 10;
  const cryptoKey = await convertCosmosKeyToCryptoKey(TEST_COSMOS_KEY);

  // empty trees container

  const treeDocs = await queryDocumentsContainersDirect(
    cryptoKey,
    TEST_COSMOS_URL,
    "sengi",
    "trees",
    "SELECT * FROM Docs d",
    [],
    {
      transform: (docs) => docs,
    },
  );

  if (treeDocs.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(
      `Container trees has ${treeDocs.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`,
    );
  }

  for (const treeDoc of treeDocs) {
    await deleteDocument(
      cryptoKey,
      TEST_COSMOS_URL,
      "sengi",
      "trees",
      treeDoc["partitionKey"] as string,
      treeDoc.id as string,
    );
  }

  // empty treePacks container

  const treePackDocs = await queryDocumentsContainersDirect(
    cryptoKey,
    TEST_COSMOS_URL,
    "sengi",
    "treePacks",
    "SELECT * FROM Docs d",
    [],
    {
      transform: (docs) => docs,
    },
  );

  if (treePackDocs.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(
      `Container treePacks has ${treePackDocs.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`,
    );
  }

  for (const treePackDoc of treePackDocs) {
    await deleteDocument(
      cryptoKey,
      TEST_COSMOS_URL,
      "sengi",
      "treePacks",
      treePackDoc["partitionKey"] as string,
      treePackDoc.id as string,
    );
  }

  // populate trees container

  const trees: DocStoreRecord[] = [
    {
      id: "01",
      docType: "tree",
      name: "ash",
      heightInCms: 210,
      docVersion: "not_used",
      docOpIds: [],
    },
    {
      id: "02",
      docType: "tree",
      name: "beech",
      heightInCms: 225,
      docVersion: "not_used",
      docOpIds: [],
    },
    {
      id: "03",
      docType: "tree",
      name: "pine",
      heightInCms: 180,
      docVersion: "not_used",
      docOpIds: [],
    },
  ];

  for (const tree of trees) {
    await createDocument(
      cryptoKey,
      TEST_COSMOS_URL,
      "sengi",
      "trees",
      TestPartition,
      tree,
      {},
    );
  }

  // populate treePacks container

  const treePacks: DocStoreRecord[] = [
    {
      id: "01",
      docType: "treePack",
      name: "ash",
      environment: "forest",
      heightInCms: 210,
      docVersion: "not_used",
      docOpIds: [],
    },
    {
      id: "02",
      docType: "treePack",
      name: "beech",
      environment: "forest",
      heightInCms: 225,
      docVersion: "not_used",
      docOpIds: [],
    },
    {
      id: "03",
      docType: "treePack",
      name: "palm",
      environment: "tropical",
      heightInCms: 180,
      docVersion: "not_used",
      docOpIds: [],
    },
    {
      id: "04",
      docType: "treePack",
      name: "coconut",
      environment: "tropical",
      heightInCms: 175,
      docVersion: "not_used",
      docOpIds: [],
    },
  ];

  for (const treePack of treePacks) {
    await createDocument(
      cryptoKey,
      TEST_COSMOS_URL,
      "sengi",
      "treePacks",
      treePack.environment as string,
      treePack,
      {},
    );
  }
}

async function readContainer(
  containerName: string,
): Promise<Record<string, unknown>[]> {
  const cryptoKey = await convertCosmosKeyToCryptoKey(TEST_COSMOS_KEY);

  const docs = await queryDocumentsContainersDirect(
    cryptoKey,
    TEST_COSMOS_URL,
    "sengi",
    containerName,
    "SELECT * FROM Docs d",
    [],
    {
      transform: (docs) => docs,
    },
  );

  return docs;
}

Deno.test("A document can be deleted from a central partition.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.deleteById("tree", TestPartition, "03", {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    {
      code: DocStoreDeleteByIdResultCode.DELETED,
    },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 2);
});

Deno.test("A document can be deleted from a non-central partition.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.deleteById(
      "treePack",
      "tropical",
      "03",
      { databaseName: "sengi", collectionName: "treePacks" },
    ),
    { code: DocStoreDeleteByIdResultCode.DELETED },
  );

  const docs = await readContainer("treePacks");
  assertEquals(docs.length, 3);
});

Deno.test("A non-existent document can be deleted without error.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.deleteById(
      "tree",
      TestPartition,
      "200",
      { databaseName: "sengi", collectionName: "trees" },
    ),
    {
      code: DocStoreDeleteByIdResultCode.NOT_FOUND,
    },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 3);
});

Deno.test("A document can be found to exist.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.exists("tree", TestPartition, "02", {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    {
      found: true,
    },
  );
});

Deno.test("A non-existent document is not found.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.exists("tree", TestPartition, "202", {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    {
      found: false,
    },
  );
});

Deno.test("A document can be fetched.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch(
    "tree",
    TestPartition,
    "02",
    { databaseName: "sengi", collectionName: "trees" },
  );

  assertObjectMatch(fetchResult.doc as Record<string, unknown>, {
    id: "02",
    docType: "tree",
    name: "beech",
    heightInCms: 225,
    docOpIds: [],
  });
});

Deno.test("A non-existent document cannot be fetched.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch(
    "tree",
    TestPartition,
    "202",
    { databaseName: "sengi", collectionName: "trees" },
  );

  assertEquals(fetchResult.doc, null);
});

Deno.test("A document can be fetched from a container that uses a partition key that is not id.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch(
    "treePack",
    "forest",
    "02",
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertObjectMatch(fetchResult.doc as Record<string, unknown>, {
    id: "02",
    docType: "treePack",
    name: "beech",
    environment: "forest",
    heightInCms: 225,
    docOpIds: [],
  });
});

Deno.test("A non-existent document cannot be fetched from a container that uses a partition key that is not id.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch(
    "treePack",
    "forest",
    "202",
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertEquals(fetchResult.doc, null);
});

Deno.test("A sql query can be executed.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const queryResult = await docStore.query(
    "tree",
    {
      queryStatement: "SELECT * FROM Docs d WHERE d.id = @id",
      parameters: [{ name: "@id", value: "01" }],
      transform: (docs) => docs,
    },
    { databaseName: "sengi", collectionName: "trees" },
  );

  assertEquals(Array.isArray(queryResult.data), true);
  assertEquals((queryResult.data as Array<unknown>).length, 1);
  assertObjectMatch((queryResult.data as Record<string, unknown>[])[0], {
    id: "01",
    docType: "tree",
    name: "ash",
    heightInCms: 210,
  });
});

Deno.test("All documents of a type can be selected from a single partition.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectAll(
    "tree",
    TestPartition,
    ["id"],
    { databaseName: "sengi", collectionName: "trees" },
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.id as string).localeCompare(b.id as string)
  );
  assertEquals(sortedDocs, [{ id: "01" }, { id: "02" }, { id: "03" }]);
});

Deno.test("Select documents using a filter.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByFilter(
    "treePack",
    "forest",
    ["id"],
    { whereClause: "d.heightInCms > 215" },
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertEquals(result.docs, [{ id: "02" }]);
});

Deno.test("Select documents using a filter, order by clause and limit.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByFilter(
    "treePack",
    "forest",
    ["id"],
    {
      whereClause: "d.heightInCms > 200",
      orderByFields: [{ fieldName: "heightInCms", direction: "ascending" }],
      limit: 1,
    },
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertEquals(result.docs, [{ id: "01" }]);
});

Deno.test("Select documents using a filter, descending order by clause and limit.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByFilter(
    "treePack",
    "forest",
    ["id"],
    {
      whereClause: "d.heightInCms > 200",
      orderByFields: [{ fieldName: "heightInCms", direction: "descending" }],
      limit: 1,
    },
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertEquals(result.docs, [{ id: "02" }]);
});

Deno.test("Select documents using an ordering clause with multiple results.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByFilter(
    "treePack",
    "forest",
    ["id"],
    {
      orderByFields: [{ fieldName: "heightInCms", direction: "descending" }],
    },
    { databaseName: "sengi", collectionName: "treePacks" },
  );

  assertEquals(result.docs, [{ id: "02" }, { id: "01" }]);
});

Deno.test("Select documents using ids.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByIds(
    "tree",
    TestPartition,
    ["id", "name"],
    ["02", "03"],
    { databaseName: "sengi", collectionName: "trees" },
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.id as string).localeCompare(b.id as string)
  );
  assertEquals(sortedDocs, [{ id: "02", name: "beech" }, {
    id: "03",
    name: "pine",
  }]);
});

Deno.test("Select documents using ids that appear multiple times.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByIds(
    "tree",
    TestPartition,
    ["name"],
    ["02", "03", "03", "02"],
    { databaseName: "sengi", collectionName: "trees" },
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.name as string).localeCompare(b.name as string)
  );
  assertEquals(sortedDocs, [{ name: "beech" }, { name: "pine" }]);
});

Deno.test("Select documents that include document versions.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByIds(
    "tree",
    TestPartition,
    ["name", "docVersion"],
    ["02"],
    { databaseName: "sengi", collectionName: "trees" },
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.name as string).localeCompare(b.name as string)
  );
  assertEquals(sortedDocs[0].name, "beech");
  assertEquals(typeof sortedDocs[0].docVersion, "string");
});

Deno.test("Insert a new document and rely on doc store to generate doc version.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  // docVersion will be stripped out before upsert
  const doc: DocStoreRecord = {
    id: "04",
    docType: "tree",
    name: "oak",
    heightInCms: 150,
    docVersion: "ignore_me",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", TestPartition, doc, null, {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    {
      code: DocStoreUpsertResultCode.CREATED,
    },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 4);

  const newDoc = docs.find((d) => d.id === "04") as Record<string, unknown>;
  assertObjectMatch(newDoc, {
    id: "04",
    docType: "tree",
    name: "oak",
    heightInCms: 150,
  });
  assertEquals(typeof newDoc._etag, "string");
});

Deno.test("Update an existing document.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const doc: DocStoreRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", TestPartition, doc, null, {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    {
      code: DocStoreUpsertResultCode.REPLACED,
    },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 3);

  const newDoc = docs.find((d) => d.id === "03") as Record<string, unknown>;
  assertObjectMatch(newDoc, {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
  });
  assertEquals(typeof newDoc._etag, "string");
});

Deno.test("Update an existing document with a required version.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const initialContents = await readContainer("trees");
  const reqVersion = (initialContents.find((d) => d.id === "03") || {})
    ._etag as string;

  const doc: DocStoreRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", TestPartition, doc, reqVersion, {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    { code: DocStoreUpsertResultCode.REPLACED },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 3);

  const newDoc = docs.find((d) => d.id === "03") as Record<string, unknown>;
  assertObjectMatch(newDoc, {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
  });
  assertEquals(typeof newDoc._etag, "string");
});

Deno.test("Fail to update an existing document if the required version is unavailable.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const doc: DocStoreRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", TestPartition, doc, "bbbb", {
      databaseName: "sengi",
      collectionName: "trees",
    }),
    { code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE },
  );

  const docs = await readContainer("trees");
  assertEquals(docs.length, 3);

  const newDoc = docs.find((d) => d.id === "03") as Record<string, unknown>;
  assertObjectMatch(newDoc, {
    id: "03",
    docType: "tree",
    name: "pine",
    heightInCms: 180,
  });
  assertEquals(typeof newDoc._etag, "string");
});
