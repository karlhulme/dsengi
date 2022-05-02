// deno-lint-ignore-file require-await
import { assertRejects } from "../../../deps.ts";
import {
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
  SengiCallbackError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Error in onDeletedDoc callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        docType: "car",
      },
    }),
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.DELETED }),
  }, {
    onDeletedDoc: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.deleteDocument({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      }),
    SengiCallbackError,
    "callback problem",
  );
});

Deno.test("Error in onSavedDoc callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    onPreSaveDoc: () => {},
    onSavedDoc: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.newDocument({
        ...defaultRequestProps,
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
        doc: {
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
    SengiCallbackError,
    "callback problem",
  );
});

Deno.test("Error in onPreSaveDoc callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
  }, {
    onPreSaveDoc: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.newDocument({
        ...defaultRequestProps,
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
        doc: {
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
    SengiCallbackError,
    "callback problem",
  );
});

Deno.test("Error in onPreSelectDocs callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    onPreSelectDocs: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.selectDocuments({
        ...defaultRequestProps,
        fieldNames: ["id"],
      }),
    SengiCallbackError,
    "callback problem",
  );
});

Deno.test("Error in getMillisecondsSinceEpoch callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    getMillisecondsSinceEpoch: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.newDocument({
        ...defaultRequestProps,
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
        doc: {
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
    SengiCallbackError,
    "callback problem",
  );
});

Deno.test("Error in getIdFromUser callback should be wrapped.", () => {
  const { sengi } = createSengiWithMockStore(undefined, {
    getIdFromUser: () => {
      throw new Error("callback problem");
    },
  });

  assertRejects(
    () =>
      sengi.newDocument({
        ...defaultRequestProps,
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
        doc: {
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
    SengiCallbackError,
    "callback problem",
  );
});
