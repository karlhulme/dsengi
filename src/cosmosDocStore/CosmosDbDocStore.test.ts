import { assertEquals } from "../../deps.ts";
import {
  convertCosmosKeyToCryptoKey,
  createDocument,
  deleteDocument,
  queryDocuments,
} from "../cosmosClient/index.ts";
import {
  DocRecord,
  DocStoreDeleteByIdResultCode,
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

// Deno.test('A document can be fetched.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   await expect(docStore.fetch('tree', 'trees', '02', {}, {})).resolves.toEqual({
//     doc: expect.objectContaining({ id: '02', docType: 'tree', name: 'beech', heightInCms: 225, docVersion: expect.any(String), docOpIds: [] })
//   })
// })

// Deno.test('A non-existent document cannot be fetched.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   await expect(docStore.fetch('tree', 'trees', '202', {}, {})).resolves.toEqual({ doc: null })
// })

// Deno.test('A document can be fetched from a container with an unknown partition key.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   // getPartitionKeyFunc will return, forcing the partition key to be looked up.
//   await expect(docStore.fetch('treePack', 'treePacks', '02', {}, {})).resolves.toEqual({
//     doc: expect.objectContaining({ id: '02', docType: 'treePack', name: 'beech', environment: 'forest', heightInCms: 225, docVersion: expect.any(String), docOpIds: [] })
//   })
// })

// Deno.test('A sql query can be executed.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   await expect(docStore.query('tree', 'trees', { sqlQuery: 'SELECT VALUE COUNT(1) FROM Docs d' }, {}, {})).resolves.toEqual({
//     data: {
//       sqlQueryResult: expect.objectContaining({
//         resources: [3]
//       })
//     }
//   })
// })

// Deno.test('An empty query can be executed.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   await expect(docStore.query('tree', 'trees', {}, {}, {})).resolves.toEqual({ data: {} })
// })

// Deno.test('All documents of a type can be selected.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectAll('tree', 'trees', ['id'], {}, {})
//   const sortedDocs = result.docs.sort((a, b) => (a.id as string).localeCompare(b.id as string))
//   expect(sortedDocs).toEqual([{ id: '01' }, { id: '02' }, { id: '03' }])
// })

// Deno.test('All documents of a type can be retrieved in pages.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectAll('tree', 'trees', ['id'], {}, { limit: 2 })
//   expect(result.docs).toHaveLength(2)

//   const result2 = await docStore.selectAll('tree', 'trees', ['id'], {}, { limit: 2, offset: 2 })
//   expect(result2.docs).toHaveLength(1)
// })

// Deno.test('Select documents using a filter.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectByFilter('treePack', 'treePacks', ['id'], { whereClause: 'd.heightInCms > 200' }, {}, {})
//   expect(result.docs).toHaveLength(2)
//   expect(result.docs.findIndex(d => d.id === '01')).toBeGreaterThanOrEqual(0)
//   expect(result.docs.findIndex(d => d.id === '02')).toBeGreaterThanOrEqual(0)
// })

// Deno.test('Select documents using a filter and paging.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectByFilter('tree', 'trees', ['id'], { whereClause: 'd.heightInCms > 200' }, {}, { limit: 1, offset: 1 })
//   expect(result.docs).toHaveLength(1)
//   expect(result.docs.findIndex(d => ['01', '02'].includes(d.id as string))).toBeGreaterThanOrEqual(0)
// })

// Deno.test('Select documents using ids.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectByIds('tree', 'trees', ['id', 'name', 'docVersion'], ['02', '03'] , {}, {})
//   expect(result.docs).toHaveLength(2)
//   expect(result.docs.find(d => d.id === '02')).toEqual({ id: '02', name: 'beech', docVersion: expect.any(String) })
//   expect(result.docs.find(d => d.id === '03')).toEqual({ id: '03', name: 'pine', docVersion: expect.any(String) })
// })

// Deno.test('Select documents using ids that appear multiple times.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const result = await docStore.selectByIds('tree', 'trees', ['name'], ['02', '03', '03', '02'] , {}, {})
//   expect(result.docs).toHaveLength(2)
//   expect(result.docs.find(d => d.name === 'beech')).toEqual({ name: 'beech' })
//   expect(result.docs.find(d => d.name === 'pine')).toEqual({ name: 'pine' })
// })

// Deno.test('Insert a new document and rely on doc store to generate doc version.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   // docVersion will be stripped out before upsert
//   const doc: DocRecord = { id: '04', docType: 'tree', name: 'oak', heightInCms: 150, docVersion: 'ignore_me', docOpIds: [] }
//   await expect(docStore.upsert('tree', 'trees', doc, {}, {})).resolves.toEqual({ code: DocStoreUpsertResultCode.CREATED })

//   const contents = await readContainer('trees')
//   expect(contents).toHaveLength(4)
//   expect(contents.find(d => d.id === '04')).toEqual(expect.objectContaining({
//     id: '04', docType: 'tree', name: 'oak', heightInCms: 150, _etag: expect.any(String)
//   }))
// })

// Deno.test('Update an existing document.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
//   await expect(docStore.upsert('tree', 'trees', doc, {}, {})).resolves.toEqual({ code: DocStoreUpsertResultCode.REPLACED })

//   const contents = await readContainer('trees')
//   expect(contents).toHaveLength(3)
//   expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
//     id: '03', docType: 'tree', name: 'palm', heightInCms: 123, _etag: expect.any(String)
//   }))
// })

// Deno.test('Update an existing document with a required version.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const initialContents = await readContainer('trees')
//   const reqVersion = (initialContents.find(d => d.id === '03') || {})._etag as string

//   const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
//   await expect(docStore.upsert('tree', 'trees', doc, {}, { reqVersion })).resolves.toEqual({ code: DocStoreUpsertResultCode.REPLACED })

//   const contents = await readContainer('trees')
//   expect(contents).toHaveLength(3)
//   expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
//     id: '03', docType: 'tree', name: 'palm', heightInCms: 123, _etag: expect.any(String)
//   }))
// })

// Deno.test('Fail to update an existing document if the required version is unavailable.', async () => {
//   await initDb();

//   const docStore = createCosmosDbDocStore()

//   const doc: DocRecord = { id: '03', docType: 'tree', name: 'palm', heightInCms: 123, docVersion: 'not_used', docOpIds: [] }
//   await expect(docStore.upsert('tree', 'trees', doc, {}, { reqVersion: 'bbbb' })).resolves.toEqual({ code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE })

//   const contents = await readContainer('trees')
//   expect(contents).toHaveLength(3)
//   expect(contents.find(d => d.id === '03')).toEqual(expect.objectContaining({
//     id: '03', docType: 'tree', name: 'pine', heightInCms: 180, _etag: expect.any(String)
//   }))
// })
