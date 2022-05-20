// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  fail,
  spy,
} from "../../../deps.ts";
import {
  SengiActionForbiddenByPolicyError,
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createSengiForTests = (sengiCtorOverrides?: Record<string, unknown>) => {
  return createSengiWithMockStore({
    selectAll: async () => ({
      docs: [
        {
          id: "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          manufacturer: "tesla",
          model: "T",
          registration: "HG12 4CD",
        },
        {
          id: "9070692f-b12c-4bbc-9888-5704fe5bc480",
          manufacturer: "mini",
          model: "cooper",
          registration: "HG12 5EF",
        },
      ],
    }),
  }, sengiCtorOverrides);
};

Deno.test("Select all documents of a type in a collection with support for paging.", async () => {
  const { sengi, docStore } = createSengiForTests();

  const spySelectAll = spy(docStore, "selectAll");

  assertEquals(
    await sengi.selectDocuments({
      ...defaultRequestProps,
      fieldNames: ["id", "model"], // the test doc store 'selectAll' implementation above will not respect this
      limit: 3,
    }),
    {
      docs: [
        {
          id: "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          manufacturer: "tesla",
          model: "T",
          registration: "HG12 4CD",
        },
        {
          id: "9070692f-b12c-4bbc-9888-5704fe5bc480",
          manufacturer: "mini",
          model: "cooper",
          registration: "HG12 5EF",
        },
      ],
    },
  );

  assertEquals(spySelectAll.callCount, 1);
  assert(
    spySelectAll.calledWith(
      "car",
      "cars",
      "_central",
      ["id", "model"],
      { custom: "prop" },
      { limit: 3 },
    ),
  );
});

Deno.test("Select all documents of a type in a collection with an onSelectDocs delegate but without paging.", async () => {
  const onPreSelectDocs = spy((..._args: unknown[]) => {});

  const { carDocType, sengi, docStore } = createSengiForTests({
    onPreSelectDocs,
  });

  const spySelectAll = spy(docStore, "selectAll");

  assertExists(
    await sengi.selectDocuments({
      ...defaultRequestProps,
      fieldNames: ["id"],
    }),
  );

  assertEquals(spySelectAll.callCount, 1);
  assert(
    spySelectAll.calledWith("car", "cars", "_central", ["id"], { custom: "prop" }, {
      limit: undefined,
    }),
  );

  assertEquals(onPreSelectDocs.callCount, 1);
  assert(onPreSelectDocs.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    fieldNames: ["id"],
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }));
});

Deno.test("Fail to select all documents of type if permissions insufficient.", async () => {
  const { sengi } = createSengiForTests();

  assertRejects(() =>
    sengi.selectDocuments({
      ...defaultRequestProps,
      apiKey: "noneKey",
      fieldNames: ["id"],
    }), SengiInsufficientPermissionsError);
});

Deno.test("Fail to select all documents of type if client api key is not recognised.", async () => {
  const { sengi } = createSengiForTests();

  assertRejects(() =>
    sengi.selectDocuments({
      ...defaultRequestProps,
      apiKey: "unknown",
      fieldNames: ["id"],
    }), SengiUnrecognisedApiKeyError);
});

Deno.test("Fail to select all documents of a type in collection if fetchWholeCollection is not allowed.", async () => {
  const { carDocType, sengi } = createSengiForTests();

  if (!carDocType.policy) {
    fail();
  }

  carDocType.policy.canFetchWholeCollection = false;

  assertRejects(() =>
    sengi.selectDocuments({
      ...defaultRequestProps,
      fieldNames: ["id"],
    }), SengiActionForbiddenByPolicyError);
});
