import { assertEquals } from "../../deps.ts";
import {
  DocRecord,
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
} from "../interfaces/index.ts";
import { MemDocStore } from "./MemDocStore.ts";

function createDocs(): DocRecord[] {
  return [
    {
      id: "001",
      docType: "test",
      fruit: "apple",
      docVersion: "aaa1",
      docOpIds: [],
      partitionKey: "_central",
    },
    {
      id: "002",
      docType: "test",
      fruit: "banana",
      docVersion: "aaa2",
      docOpIds: [],
      partitionKey: "_central",
    },
    {
      id: "003",
      docType: "test",
      fruit: "orange",
      docVersion: "aaa3",
      docOpIds: [],
      partitionKey: "_central",
    },
    {
      id: "101",
      docType: "test2",
      vehicle: "car",
      docVersion: "a101",
      docOpIds: [],
      partitionKey: "_central",
    },
    {
      id: "102",
      docType: "test2",
      vehicle: "cargoBoat",
      docVersion: "a102",
      docOpIds: [],
      partitionKey: "_central",
    },
    {
      id: "103",
      docType: "test2",
      vehicle: "plane",
      docVersion: "a103",
      docOpIds: [],
      partitionKey: "_central",
    },
  ];
}

function generateDocVersionFunc() {
  return "xxxx";
}

Deno.test("A document can be deleted.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.deleteById(
    "test",
    "tests",
    "_central",
    "003",
    {},
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
    "tests",
    "_central",
    "200",
    {},
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
    "tests",
    "_central",
    "003",
    {},
    {},
  );
  assertEquals(result, { found: true });
});

Deno.test("A non-existent document is not found.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.exists(
    "test",
    "tests",
    "_central",
    "005",
    {},
    {},
  );
  assertEquals(result, { found: false });
});

Deno.test("A document can be fetched.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.fetch(
    "test",
    "tests",
    "_central",
    "003",
    {},
    {},
  );
  assertEquals(result, {
    doc: {
      id: "003",
      docType: "test",
      fruit: "orange",
      docVersion: "aaa3",
      docOpIds: [],
      partitionKey: "_central",
    },
  });
});

Deno.test("A non-existent document cannot be fetched.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.fetch(
    "test",
    "tests",
    "_central",
    "005",
    {},
    {},
  );
  assertEquals(result, { doc: null });
});

Deno.test("A count query can be executed.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.query(
    "test",
    "tests",
    { reducer: (agg) => (agg as number) + 1, initialValue: 0 },
    {},
    {},
  );
  assertEquals(result, { data: 3 });
});

Deno.test("All documents of a type can be selected.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectAll(
    "test",
    "tests",
    "_central",
    ["id"],
    {},
    {},
  );
  assertEquals(result, { docs: [{ id: "001" }, { id: "002" }, { id: "003" }] });
  const result2 = await docStore.selectAll(
    "test2",
    "test2s",
    "_central",
    ["vehicle"],
    {},
    {},
  );
  assertEquals(result2, {
    docs: [{ vehicle: "car" }, { vehicle: "cargoBoat" }, { vehicle: "plane" }],
  });
});

Deno.test("All documents of a recognised type can selected.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectAll(
    "test3",
    "tests",
    "_central",
    ["fieldA", "fieldB"],
    {},
    {},
  );
  assertEquals(result, { docs: [] });
});

Deno.test("Select documents using a filter.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByFilter(
    "test2",
    "test2s",
    "_central",
    ["id", "vehicle"],
    (d) => (d.vehicle as string).startsWith("c"),
    {},
    {},
  );
  assertEquals(result, {
    docs: [{ id: "101", vehicle: "car" }, { id: "102", vehicle: "cargoBoat" }],
  });
});

Deno.test("Select documents using ids.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByIds(
    "test",
    "tests",
    "_central",
    ["id", "fruit"],
    ["002", "003"],
    {},
    {},
  );
  assertEquals(result, {
    docs: [{ id: "002", fruit: "banana" }, { id: "003", fruit: "orange" }],
  });
});

Deno.test("Select documents using ids that appear multiple times.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.selectByIds(
    "test",
    "tests",
    "_central",
    ["id", "fruit"],
    ["002", "003", "002"],
    {},
    {},
  );
  assertEquals(result, {
    docs: [{ id: "002", fruit: "banana" }, { id: "003", fruit: "orange" }],
  });
});

Deno.test("Insert a new document and rely on doc store to generate doc version.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test",
    "tests",
    "_central",
    {
      id: "004",
      docType: "test",
      fruit: "kiwi",
      docVersion: "000",
      docOpIds: [],
    },
    {},
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
    fruit: "kiwi",
    docVersion: "xxxx",
    docOpIds: [],
    partitionKey: "_central",
  });
});

Deno.test("Update an existing document.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "test2s",
    "_central",
    {
      id: "102",
      docType: "test2",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
    },
    {},
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
    vehicle: "tank",
    docVersion: "xxxx",
    docOpIds: [],
    partitionKey: "_central",
  });
});

Deno.test("Update an existing document with a required version.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "test2s",
    "_central",
    {
      id: "102",
      docType: "test2",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
    },
    {},
    { reqVersion: "a102" },
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
    vehicle: "tank",
    docVersion: "xxxx",
    docOpIds: [],
    partitionKey: "_central",
  });
});

Deno.test("Fail to update an existing document if the required version is unavailable.", async () => {
  const docs = createDocs();
  const docStore = new MemDocStore({ docs, generateDocVersionFunc });
  const result = await docStore.upsert(
    "test2",
    "test2s",
    "_central",
    {
      id: "102",
      docType: "test2",
      vehicle: "tank",
      docVersion: "000",
      docOpIds: [],
    },
    {},
    { reqVersion: "a999" },
  );
  assertEquals(result, {
    code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
  });
  assertEquals(docs.length, 6);
  assertEquals(docs[4], {
    id: "102",
    docType: "test2",
    vehicle: "cargoBoat",
    docVersion: "a102",
    docOpIds: [],
    partitionKey: "_central",
  });
});
