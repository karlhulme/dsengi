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

const newCarTemplate: Partial<Car> = {
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Adding a new document should call exists and then upsert on doc store.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "00000000-1234-1234-1234-000000000000",
    docType: "car",
    docStatus: "active",
    docOpIds: ["00000000-0000-0000-0000-111122223333"],
    docDigests: [
      "3333:C0:a48dbeeb8fe1cffe8bf608705f816c9706ac17fe",
    ],
    docVersion: "1111-2222",
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
      operationId: "00000000-0000-0000-0000-111122223333",
      doc: {
        ...newCarTemplate,
      },
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
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "99999999-9999-9999-9999-999999999999",
    docType: "car",
    docStatus: "active",
    docOpIds: ["00000000-0000-0000-0000-111122223333"],
    docDigests: [
      "3333:C0:a48dbeeb8fe1cffe8bf608705f816c9706ac17fe",
    ],
    docVersion: "1111-2222",
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
      operationId: "00000000-0000-0000-0000-111122223333",
      sequenceNo: "0",
      explicitId: "99999999-9999-9999-9999-999999999999",
      doc: {
        ...newCarTemplate,
      },
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

Deno.test("Do not create a document if one already exists with the same digest.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    selectByDigest: async () => ({ docs: [{ id: "abcd" }] }),
  });

  const spyUpsert = spy(docStore, "upsert");

  await sengi.newDocument<Car>({
    ...defaultRequestProps,
    operationId: "00000000-0000-0000-0000-111122223333",
    doc: {
      ...newCarTemplate,
      registration: "HZ12 3AB",
    },
  });

  assertEquals(spyUpsert.callCount, 0);
});

Deno.test("Fail to add a new document that does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore();

  assertRejects(async () => {
    await sengi.newDocument<Car>({
      ...defaultRequestProps,
      operationId: "00000000-0000-0000-0000-111122223333",
      doc: {
        ...newCarTemplate,
        registration: "HZ12 3AB",
      },
    });
  }, SengiDocValidationFailedError);
});
