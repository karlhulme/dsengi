import { assertEquals, assertObjectMatch } from "../../deps.ts";
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  queryDocuments,
} from "../cosmosClient/index.ts";
import {
  DocRecord,
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";
import { CosmosDbDocStore } from "./CosmosDbDocStore.ts";

const TEST_COSMOS_URL = Deno.env.get("SENGI_COSMOS_URL") || "";
const TEST_COSMOS_KEY = await convertCosmosKeyToCryptoKey(
  Deno.env.get("SENGI_COSMOS_KEY") || "",
);

function createCosmosDbDocStore(): CosmosDbDocStore {
  return new CosmosDbDocStore({
    cosmosUrl: TEST_COSMOS_URL,
    cosmosKey: TEST_COSMOS_KEY,
    getDatabaseNameFunc: () => "sengi",
    getContainerNameFunc: (
      _databaseName: string,
      _docTypeName: string,
      docTypePluralName: string,
    ) => docTypePluralName,
    getPartitionKeyValueFunc: (
      _databaseName: string,
      _containerName: string,
      _docTypeName: string,
      docTypePluralName: string,
      doc: DocRecord,
    ) =>
      docTypePluralName === "trees"
        ? doc.id as string
        : doc.environment as string,
  });
}

async function initDb(): Promise<void> {
  const MAX_ITEMS_TO_DELETE = 10;

  // empty trees container

  const treeDocs = await queryDocuments(
    TEST_COSMOS_KEY,
    TEST_COSMOS_URL,
    "sengi",
    "trees",
    "SELECT * FROM Docs d",
    [],
    {
      crossPartition: true,
    },
  );

  if (treeDocs.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(
      `Container trees has ${treeDocs.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`,
    );
  }

  for (const treeDoc of treeDocs) {
    await deleteDocument(
      TEST_COSMOS_KEY,
      TEST_COSMOS_URL,
      "sengi",
      "trees",
      treeDoc.id as string,
      treeDoc.id as string,
    );
  }

  // empty treePacks container

  const treePackDocs = await queryDocuments(
    TEST_COSMOS_KEY,
    TEST_COSMOS_URL,
    "sengi",
    "treePacks",
    "SELECT * FROM Docs d",
    [],
    {
      crossPartition: true,
    },
  );

  if (treePackDocs.length > MAX_ITEMS_TO_DELETE) {
    throw new Error(
      `Container treePacks has ${treePackDocs.length} items.  Max that can be deleted is ${MAX_ITEMS_TO_DELETE}.`,
    );
  }

  for (const treePackDoc of treePackDocs) {
    await deleteDocument(
      TEST_COSMOS_KEY,
      TEST_COSMOS_URL,
      "sengi",
      "treePacks",
      treePackDoc.id as string,
      treePackDoc.environment as string,
    );
  }

  // populate trees container

  const trees: DocRecord[] = [
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
      TEST_COSMOS_KEY,
      TEST_COSMOS_URL,
      "sengi",
      "trees",
      tree,
      tree.id as string,
      {},
    );
  }

  // populate treePacks container

  const treePacks: DocRecord[] = [
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
      TEST_COSMOS_KEY,
      TEST_COSMOS_URL,
      "sengi",
      "treePacks",
      treePack,
      treePack.environment as string,
      {},
    );
  }
}

async function readContainer(
  containerName: string,
): Promise<Record<string, unknown>[]> {
  const docs = await queryDocuments(
    TEST_COSMOS_KEY,
    TEST_COSMOS_URL,
    "sengi",
    containerName,
    "SELECT * FROM Docs d",
    [],
    {
      crossPartition: true,
    },
  );

  return docs;
}

Deno.test("A document can be deleted.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(await docStore.deleteById("tree", "trees", "03", {}, {}), {
    code: DocStoreDeleteByIdResultCode.DELETED,
  });

  const docs = await readContainer("trees");
  assertEquals(docs.length, 2);
});

Deno.test("A non-existent document can be deleted without error.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(await docStore.deleteById("tree", "trees", "200", {}, {}), {
    code: DocStoreDeleteByIdResultCode.NOT_FOUND,
  });

  const docs = await readContainer("trees");
  assertEquals(docs.length, 3);
});

Deno.test("A document can be deleted from a container where the partition key value must be queried.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(
    await docStore.deleteById("treePack", "treePacks", "03", {}, {}),
    { code: DocStoreDeleteByIdResultCode.DELETED },
  );

  const docs = await readContainer("treePacks");
  assertEquals(docs.length, 3);
});

Deno.test("A document can be found to exist.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(await docStore.exists("tree", "trees", "02", {}, {}), {
    found: true,
  });
});

Deno.test("A non-existent document is not found.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  assertEquals(await docStore.exists("tree", "trees", "202", {}, {}), {
    found: false,
  });
});

Deno.test("A document can be fetched.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch("tree", "trees", "02", {}, {});

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

  const fetchResult = await docStore.fetch("tree", "trees", "202", {}, {});

  assertEquals(fetchResult.doc, null);
});

Deno.test("A document can be fetched from a container that uses a partition key that is not id.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const fetchResult = await docStore.fetch(
    "treePack",
    "treePacks",
    "02",
    {},
    {},
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
    "treePacks",
    "202",
    {},
    {},
  );

  assertEquals(fetchResult.doc, null);
});

Deno.test("A sql query can be executed.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const queryResult = await docStore.query(
    "tree",
    "trees",
    { sqlQuery: 'SELECT * FROM Docs d WHERE d.id = "01"' },
    {},
    {},
  );

  assertEquals(queryResult.data.docs?.length, 1);
  assertObjectMatch(queryResult.data.docs?.[0] as Record<string, unknown>, {
    id: "01",
    docType: "tree",
    name: "ash",
    heightInCms: 210,
  });
});

Deno.test("An empty query can be executed.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const queryResult = await docStore.query(
    "tree",
    "trees",
    {},
    {},
    {},
  );

  assertEquals(queryResult.data, {});
});

Deno.test("All documents of a type can be selected.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectAll("tree", "trees", ["id"], {}, {});
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
    "treePacks",
    ["id"],
    { whereClause: "d.heightInCms > 200" },
    {},
    {},
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.id as string).localeCompare(b.id as string)
  );
  assertEquals(sortedDocs, [{ id: "01" }, { id: "02" }]);
});

Deno.test("Select documents using ids.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  const result = await docStore.selectByIds(
    "tree",
    "trees",
    ["id", "name"],
    ["02", "03"],
    {},
    {},
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
    "trees",
    ["name"],
    ["02", "03", "03", "02"],
    {},
    {},
  );
  const sortedDocs = result.docs.sort((a, b) =>
    (a.name as string).localeCompare(b.name as string)
  );
  assertEquals(sortedDocs, [{ name: "beech" }, { name: "pine" }]);
});

Deno.test("Insert a new document and rely on doc store to generate doc version.", async () => {
  await initDb();

  const docStore = createCosmosDbDocStore();

  // docVersion will be stripped out before upsert
  const doc: DocRecord = {
    id: "04",
    docType: "tree",
    name: "oak",
    heightInCms: 150,
    docVersion: "ignore_me",
    docOpIds: [],
  };
  assertEquals(await docStore.upsert("tree", "trees", doc, {}, {}), {
    code: DocStoreUpsertResultCode.CREATED,
  });

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

  const doc: DocRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(await docStore.upsert("tree", "trees", doc, {}, {}), {
    code: DocStoreUpsertResultCode.REPLACED,
  });

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

  const doc: DocRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", "trees", doc, {}, { reqVersion }),
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

  const doc: DocRecord = {
    id: "03",
    docType: "tree",
    name: "palm",
    heightInCms: 123,
    docVersion: "not_used",
    docOpIds: [],
  };
  assertEquals(
    await docStore.upsert("tree", "trees", doc, {}, { reqVersion: "bbbb" }),
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
