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
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Select by document ids.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    selectByIds: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  });

  const spySelectByIds = spy(docStore, "selectByIds");

  assertEquals(
    await sengi.selectDocumentsByIds({
      ...defaultRequestProps,
      fieldNames: ["id", "model"], // the test doc store 'selectByIds' implementation above will not respect this
      ids: ["06151119-065a-4691-a7c8-2d84ec746ba9"],
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

  assertEquals(spySelectByIds.callCount, 1);
  assert(
    spySelectByIds.calledWith(
      "car",
      "cars",
      "_central",
      ["id", "model"],
      ["06151119-065a-4691-a7c8-2d84ec746ba9"],
      { custom: "prop" },
      {},
    ),
  );
});

Deno.test("Select by document ids using a onPreSelectDocs delegate.", async () => {
  const onPreSelectDocs = spy((..._args: unknown[]) => {});

  const { carDocType, sengi } = createSengiWithMockStore({
    selectByIds: async () => ({
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

  assertExists(
    await sengi.selectDocumentsByIds({
      ...defaultRequestProps,
      fieldNames: ["id", "model"],
      ids: ["06151119-065a-4691-a7c8-2d84ec746ba9"],
    }),
  );

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

Deno.test("Fail to select by document ids if permissions insufficient.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(() =>
    sengi.selectDocumentsByIds({
      ...defaultRequestProps,
      apiKey: "noneKey",
      fieldNames: ["id", "model"],
      ids: [
        "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
        "9070692f-b12c-4bbc-9888-5704fe5bc480",
      ],
    }), SengiInsufficientPermissionsError);
});

Deno.test("Fail to select by document ids if client api key is not recognised.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(() =>
    sengi.selectDocumentsByIds({
      ...defaultRequestProps,
      apiKey: "unknown",
      fieldNames: ["id", "model"],
      ids: [
        "c75321e5-5c8a-49f8-a525-f0f472fb5fa0",
        "9070692f-b12c-4bbc-9888-5704fe5bc480",
      ],
    }), SengiUnrecognisedApiKeyError);
});
