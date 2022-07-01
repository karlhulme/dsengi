// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const newCar: Partial<Car> = {
  id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Adding a new document should call exists and then upsert on doc store.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    docType: "car",
    docOpIds: [],
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,

    // fields
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      doc: newCar,
      fieldNames: ["id"],
    }),
    {
      isNew: true,
      doc: {
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      },
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(spyFetch.calledWith(
    "car",
    "_central",
    "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
    { custom: "prop" },
  ));

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "_central",
    resultDoc,
    null,
    { custom: "prop" },
  ));
});

Deno.test("Adding a new document that already exists should not lead to a call to upsert.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({
      doc: {
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      },
    }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyFetch = spy(docStore, "fetch");
  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      doc: newCar,
      fieldNames: ["id"],
    }),
    {
      isNew: false,
      doc: {
        id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      },
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to add a new document that does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  assertRejects(async () => {
    await sengi.newDocument({
      ...defaultRequestProps,
      doc: { ...newCar, registration: "HZ12 3AB" },
      fieldNames: ["id"],
    });
  }, SengiDocValidationFailedError);
});
