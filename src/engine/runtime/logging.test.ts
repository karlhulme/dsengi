// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import { DocStoreUpsertResultCode } from "../../interfaces/index.ts";
import {
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Log requests to the console.", () => {
  const { sengi } = createSengiWithMockStore({
    exists: async () => ({ found: false }),
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    log: true,
  });

  const origFn = console.log;

  try {
    const newFn = spy();
    console.log = newFn;

    sengi.newDocument({
      ...defaultRequestProps,
      doc: {
        id: "d7fe060b-1111-2222-3333-ab1838078473",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      },
      fieldNames: ["id"],
    });

    assertEquals(newFn.callCount, 1);
    assert(newFn.calledWith("NEW car"));
  } finally {
    console.log = origFn;
  }
});
