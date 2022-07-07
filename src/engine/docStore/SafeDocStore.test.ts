// deno-lint-ignore-file require-await
import { assertEquals, assertRejects, assertThrows } from "../../../deps.ts";
import {
  DocStore,
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
  MissingDocStoreFunctionError,
  UnexpectedDocStoreError,
} from "../../interfaces/index.ts";
import { SafeDocStore } from "./SafeDocStore.ts";

function createTestDocStore(): DocStore<unknown, unknown, unknown> {
  return {
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
    exists: async () => ({ found: true }),
    fetch: async () => ({
      doc: { id: "1234", docType: "test", docVersion: "aaaa", docOpIds: [] },
    }),
    query: async () => ({ data: null, queryCharge: 0 }),
    selectAll: async () => ({ docs: [], queryCharge: 0 }),
    selectByFilter: async () => ({ docs: [], queryCharge: 0 }),
    selectByIds: async () => ({ docs: [], queryCharge: 0 }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  };
}

type DocStoreAmendFunc = (docStore: Record<string, unknown>) => void;

function createBespokeDocStore(
  amendFunc: DocStoreAmendFunc,
): DocStore<unknown, unknown, unknown> {
  const docStore = createTestDocStore();
  amendFunc(docStore as unknown as Record<string, unknown>);
  return docStore;
}

Deno.test("A safe doc store passes through values from the underlying doc store.", async () => {
  const docStore = createTestDocStore();
  const safeDocStore = new SafeDocStore(docStore);

  assertEquals(await safeDocStore.deleteById("", "", "", {}), {
    code: DocStoreDeleteByIdResultCode.DELETED,
  });
  assertEquals(await safeDocStore.exists("", "", "", {}), {
    found: true,
  });
  assertEquals(await safeDocStore.fetch("", "", "", {}), {
    doc: { id: "1234", docType: "test", docVersion: "aaaa", docOpIds: [] },
  });
  assertEquals(await safeDocStore.query("", "", {}), {
    data: null,
    queryCharge: 0,
  });
  assertEquals(await safeDocStore.selectAll("", "", {}), {
    docs: [],
    queryCharge: 0,
  });
  assertEquals(await safeDocStore.selectByFilter("", "", {}, {}), {
    docs: [],
    queryCharge: 0,
  });
  assertEquals(await safeDocStore.selectByIds("", "", [], {}), {
    docs: [],
    queryCharge: 0,
  });
  assertEquals(await safeDocStore.upsert("", "", {}, null, {}), {
    code: DocStoreUpsertResultCode.CREATED,
  });
});

Deno.test("A safe doc store detects missing methods.", () => {
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.deleteById;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.exists;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.fetch;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.query;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.selectAll;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.selectByFilter;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.selectByIds;
    })), MissingDocStoreFunctionError);
  assertThrows(() =>
    new SafeDocStore(createBespokeDocStore((ds) => {
      delete ds.upsert;
    })), MissingDocStoreFunctionError);
});

Deno.test("A safe doc store wraps underlying errors.", async () => {
  const docStore = createBespokeDocStore((ds) => {
    ds.deleteById = async () => {
      throw new Error("fail");
    };
    ds.exists = async () => {
      throw new Error("fail");
    };
    ds.fetch = async () => {
      throw new Error("fail");
    };
    ds.query = async () => {
      throw new Error("fail");
    };
    ds.selectAll = async () => {
      throw new Error("fail");
    };
    ds.selectByFilter = async () => {
      throw new Error("fail");
    };
    ds.selectByIds = async () => {
      throw new Error("fail");
    };
    ds.upsert = async () => {
      throw new Error("fail");
    };
  });

  const safeDocStore = new SafeDocStore(docStore);

  await assertRejects(
    () => safeDocStore.deleteById("", "", "", {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.exists("", "", "", {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.fetch("", "", "", {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.query("", "", {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.selectAll("", "", {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.selectByFilter("", "", {}, {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.selectByIds("", "", [], {}),
    UnexpectedDocStoreError,
  );
  await assertRejects(
    () => safeDocStore.upsert("", "", {}, null, {}),
    UnexpectedDocStoreError,
  );
});
