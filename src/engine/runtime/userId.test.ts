import { assertRejects } from "../../../deps.ts";
import { SengiUserIdValidationFailedError } from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Reject an invalid user id.", async () => {
  const { sengi } = createSengiWithMockStore();

  await assertRejects(
    () =>
      sengi.newDocument<Car>({
        ...defaultRequestProps,
        userId: 123 as unknown as string,
        docTypeName: "car",
        operationId: "00000000-0000-0000-0000-111122223333",
        doc: {
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      }),
    SengiUserIdValidationFailedError,
    "user id '123'",
  );
});
