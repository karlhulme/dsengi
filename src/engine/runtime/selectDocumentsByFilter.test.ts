// deno-lint-ignore-file require-await
import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  spy,
} from "../../../deps.ts";
import {
  SengiInsufficientPermissionsError,
  SengiUnrecognisedApiKeyError,
  SengiUnrecognisedFilterNameError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Select by document filter with support for paging.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    selectByFilter: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  });

  const spySelectByFilter = spy(docStore, "selectByFilter");

  assertEquals(
    await sengi.selectDocumentsByFilter({
      ...defaultRequestProps,
      fieldNames: ["id", "model"], // the test doc store 'selectByFilter' implementation above will not respect this
      filterName: "byModel",
      filterParams: "ka",
      limit: 1,
    }),
    {
      docs: [
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      ],
    },
  );

  assertEquals(spySelectByFilter.callCount, 1);
  assert(spySelectByFilter.calledWith(
    "car",
    "cars",
    "_central",
    ["id", "model"],
    "MODEL=ka",
    { custom: "prop" },
    { limit: 1 },
  ));
});

Deno.test("Select by document filter with onPreSelectDocs delegate and without paging.", async () => {
  const onPreSelectDocs = spy((..._args: unknown[]) => {});

  const { carDocType, sengi, docStore } = createSengiWithMockStore({
    selectByFilter: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  }, {
    onPreSelectDocs,
  });

  const spySelectByFilter = spy(docStore, "selectByFilter");

  assertExists(
    await sengi.selectDocumentsByFilter({
      ...defaultRequestProps,
      fieldNames: ["id", "model"],
      filterName: "byModel",
      filterParams: "ka",
    }),
  );

  assertEquals(spySelectByFilter.callCount, 1);
  assert(spySelectByFilter.calledWith(
    "car",
    "cars",
    "_central",
    ["id", "model"],
    "MODEL=ka",
    { custom: "prop" },
    { limit: undefined },
  ));

  assertEquals(onPreSelectDocs.callCount, 1);
  assert(onPreSelectDocs.calledWith({
    clientName: "admin",
    docStoreOptions: { custom: "prop" },
    reqProps: { foo: "bar" },
    docType: carDocType,
    fieldNames: ["id", "model"],
    user: {
      userId: "user-0001",
      username: "testUser",
    },
  }));
});

Deno.test("Fail to select by document filter if filter name not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(() =>
    sengi.selectDocumentsByFilter({
      ...defaultRequestProps,
      fieldNames: ["id"],
      filterName: "byInvalid",
      filterParams: {},
    }), SengiUnrecognisedFilterNameError);
});

Deno.test("Fail to select by document filter if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(() =>
    sengi.selectDocumentsByFilter({
      ...defaultRequestProps,
      apiKey: "noneKey",
      fieldNames: ["id"],
      filterName: "byModel",
      filterParams: "ka",
    }), SengiInsufficientPermissionsError);
});

Deno.test("Fail to select by document filter if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(() =>
    sengi.selectDocumentsByFilter({
      ...defaultRequestProps,
      apiKey: "unknown",
      fieldNames: ["id"],
      filterName: "byModel",
      filterParams: "ka",
    }), SengiUnrecognisedApiKeyError);
});
