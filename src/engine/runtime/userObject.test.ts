// deno-lint-ignore-file require-await
import { assertEquals, assertRejects } from "../../../deps.ts";
import {
  DocStoreUpsertResultCode,
  SengiUserValidationFailedError,
} from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const newCar = {
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
      user: { userId: "testUser", username: "valid-string" },
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    }),
    { isNew: true },
  );
});

Deno.test("Supplying a invalid user object causes an error.", () => {
  const { sengi } = createSengiWithMockStore({});

  assertRejects(() =>
    sengi.newDocument({
      ...defaultRequestProps,
      user: { userId: 123, username: "invalid: not-a-string" },
      docTypeName: "car",
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      doc: newCar,
    }), SengiUserValidationFailedError);
});
