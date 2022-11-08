// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiActionForbiddenByPolicyError,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

function createNewDocument(): Partial<Car> {
  return {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docStatus: "active",
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };
}

Deno.test("Replacing a document should call upsert on the doc store.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  });

  const spyUpsert = spy(docStore, "upsert");

  const resultDoc = {
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    docType: "car",
    docStatus: "active",
    docVersion: "1111-2222",
    docCreatedByUserId: "user-0001",
    docCreatedMillisecondsSinceEpoch: 1629881470000,
    docLastUpdatedByUserId: "user-0001",
    docLastUpdatedMillisecondsSinceEpoch: 1629881470000,
    docOpIds: [],
    docDigests: [],
    manufacturer: "ford",
    model: "ka",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.replaceDocument<Car>({
      ...defaultRequestProps,
      docTypeName: "car",
      doc: createNewDocument() as Car,
    }),
    {
      isNew: false,
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

Deno.test("Fail to replace a document if it does not conform to the doc type schema.", async () => {
  const { sengi } = createSengiWithMockStore();

  await assertRejects(() =>
    sengi.replaceDocument<Car>({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument() as Car,
        model: 123 as unknown as string, // rather than a string
      },
    }), SengiDocValidationFailedError);
});

Deno.test("Fail to replace a document if it fails custom validation.", async () => {
  const { sengi } = createSengiWithMockStore();

  await assertRejects(() =>
    sengi.replaceDocument<Car>({
      ...defaultRequestProps,
      doc: {
        ...createNewDocument() as Car,
        registration: "HZ12 3AB", // registration must begin HG
      },
    }), SengiDocValidationFailedError);
});

Deno.test("Fail to replace a document if disallowed by doc type policy.", async () => {
  const { carDocType, sengi } = createSengiWithMockStore({
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  if (carDocType.policy) {
    carDocType.policy.canReplaceDocuments = false;
  }

  await assertRejects(() =>
    sengi.replaceDocument<Car>({
      ...defaultRequestProps,
      doc: createNewDocument() as Car,
    }), SengiActionForbiddenByPolicyError);
});
