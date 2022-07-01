// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiCtorParamsValidationFailedError,
  SengiDocValidationFailedError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

function defaultImplementation(params: string): Partial<Car> {
  return {
    manufacturer: "tesla",
    model: "T",
    registration: params,
  };
}

Deno.test("Creating a document with a constructor should call exists and then upsert on doc store.", async () => {
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
    manufacturer: "tesla",
    model: "T",
    registration: "HG12 3AB",
  };

  assertEquals(
    await sengi.createDocument<Car, string>({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      validateParams: () => {},
      implementation: defaultImplementation,
      constructorParams: "HG12 3AB",
      fieldNames: ["id"],
    }),
    {
      isNew: true,
      doc: { id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1" },
    },
  );

  assertEquals(spyFetch.callCount, 1);
  assert(
    spyFetch.calledWithExactly(
      "car",
      "_central",
      "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      { custom: "prop" },
    ),
  );

  assertEquals(spyUpsert.callCount, 1);
  assert(
    spyUpsert.calledWithExactly(
      "car",
      "_central",
      resultDoc,
      null,
      { custom: "prop" },
    ),
  );
});

Deno.test("Creating a document using the default getMillisecondsSinceEpoch implementations.", async () => {
  const { docStore, sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    getMillisecondsSinceEpoch: null,
  });

  const spyUpsert = spy(docStore, "upsert");

  assertEquals(
    await sengi.createDocument<Car, string>({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      validateParams: () => {},
      implementation: defaultImplementation,
      fieldNames: ["id"],
      constructorParams: "HG12 3AB",
    }),
    { isNew: true, doc: { id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1" } },
  );

  assertEquals(spyUpsert.callCount, 1);
});

Deno.test("Creating a document with a constructor that already exists should not lead to a call to upsert.", async () => {
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
    await sengi.createDocument<Car, string>({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      validateParams: () => {},
      implementation: defaultImplementation,
      constructorParams: "HG12 3AB",
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

Deno.test("Fail to create a document using a constructor where the constructor params do not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(() =>
    sengi.createDocument<Car, string>({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      validateParams: () => {
        return "invalid params";
      },
      implementation: defaultImplementation,
      constructorParams: "not-valid",
      fieldNames: ["id"],
    }), SengiCtorParamsValidationFailedError);
});

Deno.test("Fail to create a document using a constructor where the resulting doc does not pass validation.", async () => {
  const { sengi } = createSengiWithMockStore({
    fetch: async () => ({ doc: null }),
  });

  await assertRejects(async () =>
    sengi.createDocument<Car, string>({
      ...defaultRequestProps,
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      validateParams: () => {},
      implementation: () => ({
        registration: 123 as unknown as string,
      }),
      constructorParams: "HZ12 3AB",
      fieldNames: ["id"],
    }), SengiDocValidationFailedError);
});
