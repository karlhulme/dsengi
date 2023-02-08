import {
  assertEquals,
  assertObjectMatch,
  MongoClient,
  MongoClientOptions,
  ServerApiVersion,
} from "../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  DocStoreRecord,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";
import { MongoDbDocStore } from "./MongoDbDocStore.ts";

// MongoDbDocStore will ensure that all inserted documents contain both an
// `_id` field and an `id` field.  The former is required for Mongo, the
// later is the standardised identity field required for Sengi.
// The `initDb` function that seeds the test database must provide both
// identity field values.

const TestPartition = "testPartition";

const MONGO_URL = Deno.env.get("MONGO_URL") || "";

function createMongoDbDocStore(): MongoDbDocStore {
  return new MongoDbDocStore({
    connectionString: MONGO_URL,
    generateDocVersionFunc: () => "xxxx",
    strict: true,
  });
}

function createMongoClient(): MongoClient {
  const connOptions: Partial<MongoClientOptions> = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  };

  const client = new MongoClient(
    MONGO_URL,
    connOptions as MongoClientOptions,
  );

  return client;
}

async function initDb(): Promise<void> {
  const client = createMongoClient();

  try {
    // empty trees container

    await client.db("sengi-ci").collection("trees").deleteMany();

    // empty treePacks container

    await client.db("sengi-ci").collection("treePacks").deleteMany();

    // populate trees container

    const trees: DocStoreRecord[] = [
      {
        _id: "01",
        id: "01",
        docType: "tree",
        docStatus: "active",
        partitionKey: "testPartition",
        name: "ash",
        heightInCms: 210,
        docVersion: "origtr01",
        docOpIds: [],
        docDigests: ["abc", "def"],
      },
      {
        _id: "02",
        id: "02",
        docType: "tree",
        docStatus: "active",
        partitionKey: "testPartition",
        name: "beech",
        heightInCms: 225,
        docVersion: "origtr02",
        docOpIds: [],
        docDigests: [],
      },
      {
        _id: "03",
        id: "03",
        docType: "tree",
        docStatus: "active",
        partitionKey: "testPartition",
        name: "pine",
        heightInCms: 180,
        docVersion: "origtr03",
        docOpIds: [],
        docDigests: [],
      },
    ];

    for (const tree of trees) {
      await client.db("sengi-ci").collection("trees").insertOne(tree);
    }

    // populate treePacks container

    const treePacks: DocStoreRecord[] = [
      {
        _id: "01",
        id: "01",
        docType: "treePack",
        docStatus: "archived",
        partitionKey: "forest",
        name: "ash",
        environment: "forest",
        heightInCms: 210,
        docVersion: "origtp01",
        docOpIds: [],
        docDigests: [],
      },
      {
        _id: "02",
        id: "02",
        docType: "treePack",
        docStatus: "active",
        partitionKey: "forest",
        name: "beech",
        environment: "forest",
        heightInCms: 225,
        docVersion: "origtp02",
        docOpIds: [],
        docDigests: [],
      },
      {
        _id: "03",
        id: "03",
        docType: "treePack",
        docStatus: "active",
        partitionKey: "tropical",
        name: "palm",
        environment: "tropical",
        heightInCms: 180,
        docVersion: "origtp03",
        docOpIds: [],
        docDigests: [],
      },
      {
        _id: "04",
        id: "04",
        docType: "treePack",
        docStatus: "active",
        partitionKey: "tropical",
        name: "coconut",
        environment: "tropical",
        heightInCms: 175,
        docVersion: "origtp04",
        docOpIds: [],
        docDigests: [],
      },
    ];

    for (const treePack of treePacks) {
      await client.db("sengi-ci").collection("treePacks").insertOne(treePack);
    }
  } finally {
    await client.close();
  }
}

async function readContainer(
  containerName: string,
): Promise<Record<string, unknown>[]> {
  const client = createMongoClient();
  try {
    const coll = client.db("sengi-ci").collection(containerName);

    const findCursor = coll.find();

    const docs = [];

    for await (const doc of findCursor) {
      docs.push(doc);
    }

    return docs;
  } finally {
    await client.close();
  }
}

function subsetDoc(
  doc: DocStoreRecord,
  fieldNames: string[],
): DocStoreRecord {
  const result: DocStoreRecord = {};

  for (const fieldName of fieldNames) {
    result[fieldName] = doc[fieldName];
  }

  return result;
}

Deno.test("A document can be deleted from a central partition.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.deleteById("tree", TestPartition, "03", {
      databaseName: "sengi-ci",
      collectionName: "trees",
    });

    assertEquals(result.code, DocStoreDeleteByIdResultCode.DELETED);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 2);
  } finally {
    await docStore.close();
  }
});

Deno.test("A document can be deleted from a non-central partition.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.deleteById(
      "treePack",
      "tropical",
      "03",
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(result.code, DocStoreDeleteByIdResultCode.DELETED);

    const docs = await readContainer("treePacks");
    assertEquals(docs.length, 3);
  } finally {
    await docStore.close();
  }
});

Deno.test("A non-existent document can be deleted without error.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.deleteById(
      "tree",
      TestPartition,
      "200",
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(result.code, DocStoreDeleteByIdResultCode.NOT_FOUND);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 3);
  } finally {
    await docStore.close();
  }
});

Deno.test("A document can be found to exist.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    assertEquals(
      await docStore.exists("tree", TestPartition, "02", {
        databaseName: "sengi-ci",
        collectionName: "trees",
      }),
      {
        found: true,
      },
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("A non-existent document is not found.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    assertEquals(
      await docStore.exists("tree", TestPartition, "202", {
        databaseName: "sengi-ci",
        collectionName: "trees",
      }),
      {
        found: false,
      },
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("A document can be fetched.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const fetchResult = await docStore.fetch(
      "tree",
      TestPartition,
      "02",
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertObjectMatch(fetchResult.doc as Record<string, unknown>, {
      id: "02",
      docType: "tree",
      docStatus: "active",
      name: "beech",
      heightInCms: 225,
      docOpIds: [],
      docDigests: [],
    });
  } finally {
    await docStore.close();
  }
});

Deno.test("A non-existent document cannot be fetched.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const fetchResult = await docStore.fetch(
      "tree",
      TestPartition,
      "202",
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(fetchResult.doc, null);
  } finally {
    await docStore.close();
  }
});

Deno.test("A document can be fetched from a container that uses a partition key that is not id.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const fetchResult = await docStore.fetch(
      "treePack",
      "forest",
      "02",
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertObjectMatch(fetchResult.doc as Record<string, unknown>, {
      id: "02",
      docType: "treePack",
      docStatus: "active",
      name: "beech",
      environment: "forest",
      heightInCms: 225,
      docOpIds: [],
      docDigests: [],
    });
  } finally {
    await docStore.close();
  }
});

Deno.test("A non-existent document cannot be fetched from a container that uses a partition key that is not id.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const fetchResult = await docStore.fetch(
      "treePack",
      "forest",
      "202",
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(fetchResult.doc, null);
  } finally {
    await docStore.close();
  }
});

Deno.test("A sql query can be executed that returns individual records.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const queryResult = await docStore.query(
      "tree",
      {
        type: "aggregate",
        pipeline: [{
          "$group": {
            "_id": "allTrees",
            "totalHeight": { "$sum": "$heightInCms" },
          },
        }],
      },
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(Array.isArray(queryResult.data), true);
    assertEquals((queryResult.data as Array<unknown>).length, 1);
    assertObjectMatch((queryResult.data as Record<string, unknown>[])[0], {
      _id: "allTrees",
      totalHeight: 615,
    });
  } finally {
    await docStore.close();
  }
});

Deno.test("A sql query can be executed that returns an aggregated value.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const queryResult = await docStore.query(
      "tree",
      {
        type: "count",
      },
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(queryResult.data, 3);
  } finally {
    await docStore.close();
  }
});

Deno.test("Select all documents of a type from a single partition.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectAll(
      "tree",
      TestPartition,
      true,
      { databaseName: "sengi-ci", collectionName: "trees" },
    );
    const sortedDocs = result.docs.sort((a, b) =>
      (a.id as string).localeCompare(b.id as string)
    );
    assertEquals(
      sortedDocs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "01" }, { id: "02" }, { id: "03" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select all documents of a type from a single partition, excluding archived.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectAll(
      "treePack",
      "forest",
      false,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );
    const sortedDocs = result.docs.sort((a, b) =>
      (a.id as string).localeCompare(b.id as string)
    );
    assertEquals(
      sortedDocs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "02" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using a filter.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByFilter(
      "treePack",
      "forest",
      {
        whereClause: {
          heightInCms: { "$gt": 215 },
        },
      },
      true,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "02" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using a filter that are not archived.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByFilter(
      "treePack",
      "forest",
      { whereClause: { heightInCms: { "$gt": 200 } } },
      false,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "02" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using a filter, order by clause and limit.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByFilter(
      "treePack",
      "forest",
      {
        whereClause: { heightInCms: { "$gt": 200 } },
        orderByFields: [{ fieldName: "heightInCms", direction: "ascending" }],
        limit: 1,
      },
      true,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "01" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using a filter, descending order by clause and limit.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByFilter(
      "treePack",
      "forest",
      {
        whereClause: { heightInCms: { "$gt": 200 } },
        orderByFields: [{ fieldName: "heightInCms", direction: "descending" }],
        limit: 1,
      },
      true,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "02" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using an ordering clause with multiple results.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByFilter(
      "treePack",
      "forest",
      {
        orderByFields: [{ fieldName: "heightInCms", direction: "descending" }],
      },
      true,
      { databaseName: "sengi-ci", collectionName: "treePacks" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "02" }, { id: "01" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using ids.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByIds(
      "tree",
      TestPartition,
      ["02", "03"],
      { databaseName: "sengi-ci", collectionName: "trees" },
    );
    const sortedDocs = result.docs.sort((a, b) =>
      (a.id as string).localeCompare(b.id as string)
    );
    assertEquals(
      sortedDocs.map((doc) => subsetDoc(doc, ["id", "name"])),
      [{ id: "02", name: "beech" }, {
        id: "03",
        name: "pine",
      }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents using ids that appear multiple times.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByIds(
      "tree",
      TestPartition,
      ["02", "03", "03", "02"],
      { databaseName: "sengi-ci", collectionName: "trees" },
    );
    const sortedDocs = result.docs.sort((a, b) =>
      (a.name as string).localeCompare(b.name as string)
    );
    assertEquals(
      sortedDocs.map((doc) => subsetDoc(doc, ["name"])),
      [{ name: "beech" }, { name: "pine" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Select a document that includes a document version.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByIds(
      "tree",
      TestPartition,
      ["02"],
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(result.docs.length, 1);
    assertEquals(result.docs[0].name, "beech");
    assertEquals(typeof result.docs[0].docVersion, "string");
  } finally {
    await docStore.close();
  }
});

Deno.test("Select documents based on a digest.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const result = await docStore.selectByDigest(
      "tree",
      TestPartition,
      "def",
      { databaseName: "sengi-ci", collectionName: "trees" },
    );

    assertEquals(
      result.docs.map((doc) => subsetDoc(doc, ["id"])),
      [{ id: "01" }],
    );
  } finally {
    await docStore.close();
  }
});

Deno.test("Insert a new document and rely on doc store to generate doc version.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    // docVersion will be stripped out before upsert
    const doc: DocStoreRecord = {
      id: "04",
      docType: "tree",
      docStatus: "active",
      name: "oak",
      heightInCms: 150,
      docVersion: "ignore_me",
      docOpIds: [],
      docDigests: [],
    };

    const result = await docStore.upsert("tree", TestPartition, doc, null, {
      databaseName: "sengi-ci",
      collectionName: "trees",
    });

    assertEquals(result.code, DocStoreUpsertResultCode.CREATED);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 4);

    const newDoc = docs.find((d) => d.id === "04") as Record<string, unknown>;
    assertObjectMatch(newDoc, {
      id: "04",
      docType: "tree",
      docStatus: "active",
      name: "oak",
      heightInCms: 150,
    });
    assertEquals(newDoc.docVersion, "xxxx");
  } finally {
    await docStore.close();
  }
});

Deno.test("Update an existing document.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const doc: DocStoreRecord = {
      id: "03",
      docType: "tree",
      docStatus: "active",
      name: "palm",
      heightInCms: 123,
      docVersion: "not_used",
      docOpIds: [],
      docDigests: [],
    };
    const result = await docStore.upsert("tree", TestPartition, doc, null, {
      databaseName: "sengi-ci",
      collectionName: "trees",
    });

    assertEquals(result.code, DocStoreUpsertResultCode.REPLACED);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 3);

    const newDoc = docs.find((d) => d._id === "03") as Record<string, unknown>;
    assertObjectMatch(newDoc, {
      id: "03",
      docType: "tree",
      docStatus: "active",
      name: "palm",
      heightInCms: 123,
    });
    assertEquals(newDoc.docVersion, "xxxx");
  } finally {
    await docStore.close();
  }
});

Deno.test("Update an existing document with a required version.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const initialContents = await readContainer("trees");
    const reqVersion = (initialContents.find((d) => d._id === "03") || {})
      .docVersion as string;

    const doc: DocStoreRecord = {
      id: "03",
      docType: "tree",
      docStatus: "active",
      name: "palm",
      heightInCms: 123,
      docVersion: "not_used",
      docOpIds: [],
      docDigests: [],
    };

    const result = await docStore.upsert(
      "tree",
      TestPartition,
      doc,
      reqVersion,
      {
        databaseName: "sengi-ci",
        collectionName: "trees",
      },
    );

    assertEquals(result.code, DocStoreUpsertResultCode.REPLACED);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 3);

    const newDoc = docs.find((d) => d._id === "03") as Record<string, unknown>;
    assertObjectMatch(newDoc, {
      id: "03",
      docType: "tree",
      docStatus: "active",
      name: "palm",
      heightInCms: 123,
    });
    assertEquals(newDoc.docVersion, "xxxx");
  } finally {
    await docStore.close();
  }
});

Deno.test("Fail to update an existing document if the required version is unavailable.", async () => {
  await initDb();

  const docStore = createMongoDbDocStore();

  try {
    const doc: DocStoreRecord = {
      id: "03",
      docType: "tree",
      docStatus: "active",
      name: "palm",
      heightInCms: 123,
      docVersion: "not_used",
      docOpIds: [],
      docDigests: [],
    };

    const result = await docStore.upsert("tree", TestPartition, doc, "bbbb", {
      databaseName: "sengi-ci",
      collectionName: "trees",
    });

    assertEquals(result.code, DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE);

    const docs = await readContainer("trees");
    assertEquals(docs.length, 3);

    const newDoc = docs.find((d) => d._id === "03") as Record<string, unknown>;
    assertObjectMatch(newDoc, {
      _id: "03",
      docType: "tree",
      docStatus: "active",
      name: "pine",
      heightInCms: 180, // original value
    });
  } finally {
    await docStore.close();
  }
});
