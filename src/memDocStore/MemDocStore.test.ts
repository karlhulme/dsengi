import { assertEquals } from "../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  DocStoreRecord,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";
import { MemDocStore } from "./MemDocStore.ts";

function createDocs(): DocStoreRecord[] {
  return [
    {
      id: "001",
      docType: "test",
      docStatus: "active",
      fruit: "apple",
      docVersion: "aaa1",
      docOpIds: [],
      docDigests: [],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 1234,
    },
    {
      id: "002",
      docType: "test",
      docStatus: "active",
      fruit: "banana",
      docVersion: "aaa2",
      docOpIds: [],
      docDigests: [],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 1234,
    },
    {
      id: "003",
      docType: "test",
      docStatus: "active",
      fruit: "orange",
      docVersion: "aaa3",
      docOpIds: [],
      docDigests: ["abcd"],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 0,
    },
    {
      id: "101",
      docType: "test2",
      docStatus: "active",
      vehicle: "car",
      docVersion: "a101",
      docOpIds: [],
      docDigests: [],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 1234,
    },
    {
      id: "102",
      docType: "test2",
      docStatus: "archived",
      vehicle: "cargoBoat",
      docVersion: "a102",
      docOpIds: [],
      docDigests: [],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 1234,
    },
    {
      id: "103",
      docType: "test2",
      docStatus: "active",
      vehicle: "plane",
      docVersion: "a103",
      docOpIds: [],
      docDigests: [],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 1234,
    },
  ];
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

function generateDocVersionFunc() {
  return "xxxx";
}

Deno.test("A document can be deleted.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.deleteById(
    "test",
    "_central",
    "003",
    {},
  );
  assertEquals(result, { code: DocStoreDeleteByIdResultCode.DELETED });
  assertEquals(docs.length, 5);
  assertEquals(docs.map((d) => d.id), ["001", "002", "101", "102", "103"]);
});

Deno.test("A non-existent document can be deleted without error.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.deleteById(
    "test",
    "_central",
    "200",
    {},
  );
  assertEquals(result, { code: DocStoreDeleteByIdResultCode.NOT_FOUND });
  assertEquals(docs.length, 6);
  assertEquals(docs.map((d) => d.id), [
    "001",
    "002",
    "003",
    "101",
    "102",
    "103",
  ]);
});

Deno.test("A document can be found to exist.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.exists(
    "test",
    "_central",
    "003",
    {},
  );
  assertEquals(result, { found: true });
});

Deno.test("A non-existent document is not found.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.exists(
    "test",
    "_central",
    "005",
    {},
  );
  assertEquals(result, { found: false });
});

Deno.test("A document can be fetched.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.fetch(
    "test",
    "_central",
    "003",
    {},
  );
  assertEquals(result, {
    doc: {
      id: "003",
      docType: "test",
      docStatus: "active",
      fruit: "orange",
      docVersion: "aaa3",
      docOpIds: [],
      docDigests: ["abcd"],
      partitionKey: "_central",
      lastSyncedMillisecondsSinceEpoch: 0,
    },
  });
});

Deno.test("A non-existent document cannot be fetched.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.fetch(
    "test",
    "_central",
    "005",
    {},
  );
  assertEquals(result, { doc: null });
});

Deno.test("A count query can be executed.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.query(
    "test",
    { reducer: (agg) => (agg as number) + 1, initialValue: 0 },
    {},
  );
  assertEquals(result, { data: 3, queryCharge: 0 });
});

Deno.test("Select documents based on digest.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByDigest(
    "test",
    "_central",
    "abcd",
    {},
  );
  assertEquals(
    result.docs.map((d) => d.id),
    ["003"],
  );
});

Deno.test("All documents of a type can be selected.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectAll(
    "test",
    "_central",
    true,
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["id"])),
    [{ id: "001" }, { id: "002" }, { id: "003" }],
  );

  const result2 = await docStore.selectAll(
    "test2",
    "_central",
    true,
    {},
  );
  assertEquals(
    result2.docs.map((doc) => subsetDoc(doc, ["vehicle"])),
    [{ vehicle: "car" }, { vehicle: "cargoBoat" }, { vehicle: "plane" }],
  );
});

Deno.test("All documents of a type that are not archived can be selected.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });

  const result = await docStore.selectAll(
    "test2",
    "_central",
    false,
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["vehicle"])),
    [{ vehicle: "car" }, { vehicle: "plane" }],
  );
});

Deno.test("All documents of an unrecognised type can be selected.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectAll(
    "test3",
    "_central",
    true,
    {},
  );
  assertEquals(result, { docs: [], queryCharge: 0 });
});

Deno.test("Select documents using a filter.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByFilter(
    "test2",
    "_central",
    (d) => (d.vehicle as string).startsWith("c"),
    true,
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["id", "vehicle"])),
    [{ id: "101", vehicle: "car" }, { id: "102", vehicle: "cargoBoat" }],
  );
});

Deno.test("Select documents using a filter that are not archived.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByFilter(
    "test2",
    "_central",
    (d) => (d.vehicle as string).startsWith("c"),
    false,
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["id", "vehicle"])),
    [{ id: "101", vehicle: "car" }],
  );
});

Deno.test("Select documents using ids.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByIds(
    "test",
    "_central",
    ["002", "003"],
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["id", "fruit"])),
    [{ id: "002", fruit: "banana" }, { id: "003", fruit: "orange" }],
  );
});

Deno.test("Select documents using ids that appear multiple times.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByIds(
    "test",
    "_central",
    ["002", "003", "002"],
    {},
  );
  assertEquals(
    result.docs.map((doc) => subsetDoc(doc, ["id", "fruit"])),
    [{ id: "002", fruit: "banana" }, { id: "003", fruit: "orange" }],
  );
});

Deno.test("Insert a new document and rely on doc store to generate doc version.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test",
    "_central",
    {
      id: "004",
      docType: "test",
      docStatus: "active",
      fruit: "kiwi",
      docVersion: "000",
      docOpIds: [],
      docDigests: [],
    },
    null,
    {},
  );
  assertEquals(result, { code: DocStoreUpsertResultCode.CREATED });
  assertEquals(docs.length, 7);
  assertEquals(docs.map((d) => d.id), [
    "001",
    "002",
    "003",
    "101",
    "102",
    "103",
    "004",
  ]);
  assertEquals(docs[6], {
    id: "004",
    docType: "test",
    docStatus: "active",
    fruit: "kiwi",
    docVersion: "xxxx",
    docOpIds: [],
    docDigests: [],
    partitionKey: "_central",
  });
});

Deno.test("Update an existing document.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "_central",
    {
      id: "102",
      docType: "test2",
      docStatus: "active",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
      docDigests: [],
    },
    null,
    {},
  );
  assertEquals(result, { code: DocStoreUpsertResultCode.REPLACED });
  assertEquals(docs.length, 6);
  assertEquals(docs.map((d) => d.id), [
    "001",
    "002",
    "003",
    "101",
    "102",
    "103",
  ]);
  assertEquals(docs[4], {
    id: "102",
    docType: "test2",
    docStatus: "active",
    vehicle: "tank",
    docVersion: "xxxx",
    docOpIds: [],
    docDigests: [],
    partitionKey: "_central",
  });
});

Deno.test("Update an existing document with a required version.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "_central",
    {
      id: "102",
      docType: "test2",
      docStatus: "active",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
      docDigests: [],
    },
    "a102",
    {},
  );
  assertEquals(result, { code: DocStoreUpsertResultCode.REPLACED });
  assertEquals(docs.length, 6);
  assertEquals(docs.map((d) => d.id), [
    "001",
    "002",
    "003",
    "101",
    "102",
    "103",
  ]);
  assertEquals(docs[4], {
    id: "102",
    docType: "test2",
    docStatus: "active",
    vehicle: "tank",
    docVersion: "xxxx",
    docOpIds: [],
    docDigests: [],
    partitionKey: "_central",
  });
});

Deno.test("Fail to update an existing document if the required version is unavailable.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "_central",
    {
      id: "102",
      docType: "test2",
      docStatus: "archived",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
      docDigests: [],
    },
    "a999",
    {},
  );
  assertEquals(result, {
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });
  assertEquals(docs.length, 6);
  assertEquals(docs[4], {
    id: "102",
    docType: "test2",
    docStatus: "archived",
    vehicle: "cargoBoat",
    docVersion: "a102",
    docOpIds: [],
    docDigests: [],
    partitionKey: "_central",
    lastSyncedMillisecondsSinceEpoch: 1234,
  });
});
