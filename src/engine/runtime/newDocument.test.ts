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
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Adding a new document should call exists and then upsert on doc store.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "00000000-1234-1234-1234-000000000000",
    docType: "car",
    docStatus: "active",
    docOpIds: ["00000000-0000-0000-0000-111122223333"],
    docVersion: "1111-2222",
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docLastSyncedMillisecondsSinceEpoch: 0,

    // fields
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      operationId: "00000000-0000-0000-0000-111122223333",
      doc: newCar,
    }),
    {
      doc: resultDoc,
    },
  );

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "_central",
    resultDoc,
    null,
    { custom: "prop" },
  ));
});

Deno.test("Adding a new document with an explicit id.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "99999999-9999-9999-9999-999999999999",
    docType: "car",
    docStatus: "active",
    docOpIds: ["00000000-0000-0000-0000-111122223333"],
    docVersion: "1111-2222",
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docLastSyncedMillisecondsSinceEpoch: 0,

    // fields
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      docTypeName: "car",
      operationId: "00000000-0000-0000-0000-111122223333",
      sequenceNo: "0",
      explicitId: "99999999-9999-9999-9999-999999999999",
      doc: newCar,
    }),
    {
      doc: resultDoc,
    },
  );

  assertEquals(spyUpsert.callCount, 1);
  assert(spyUpsert.calledWith(
    "car",
    "_central",
    resultDoc,
    null,
    { custom: "prop" },
  ));
});

Deno.test("Fail to add a new document that does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  assertRejects(async () => {
    await sengi.newDocument<Car>({
      ...defaultRequestProps,
      operationId: "00000000-0000-0000-0000-111122223333",
      doc: {
        ...newCar,
        registration: "HZ12 3AB",
      },
    });
  }, SengiDocValidationFailedError);
});
