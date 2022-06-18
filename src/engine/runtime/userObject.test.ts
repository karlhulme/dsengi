// deno-lint-ignore-file require-await
import { assertEquals, assertRejects } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiUserClaimsValidationFailedError,
  SengiUserIdValidationFailedError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const newCar = {
  id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Supplying a valid user object is accepted.", async () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  });

  assertEquals(
    await sengi.newDocument({
      ...defaultRequestProps,
      userId: "testUser",
      userClaims: ["valid-claim"],
      docTypeName: "car",
      doc: newCar,
      fieldNames: ["id"],
    }),
    { isNew: true, doc: { id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1" } },
  );
});

Deno.test("Supplying an invalid user id causes an error.", async () => {
  const { sengi } = createSengiWithMockStore({});

  await assertRejects(() =>
    sengi.newDocument({
      ...defaultRequestProps,
      userId: 123 as unknown as string,
      userClaims: [],
      docTypeName: "car",
      doc: newCar,
      fieldNames: ["id"],
    }), SengiUserIdValidationFailedError);
});

Deno.test("Supplying invalid user claims causes an error.", async () => {
  const { sengi } = createSengiWithMockStore({});

  await assertRejects(() =>
    sengi.newDocument({
      ...defaultRequestProps,
      userId: "valid-user",
      userClaims: [123] as unknown as string[],
      docTypeName: "car",
      doc: newCar,
      fieldNames: ["id"],
    }), SengiUserClaimsValidationFailedError);
});
