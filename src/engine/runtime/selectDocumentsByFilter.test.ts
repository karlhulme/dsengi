// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Select documents using a filter.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    selectByFilter: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  });

  const spySelectByFilter = spy(docStore, "selectByFilter");

  assertEquals(
    await sengi.selectDocumentsByFilter<Car>({
      ...defaultRequestProps,
      filter: "MODEL=ka",
    }),
    {
      docs: [
        {
          id: "06151119-065a-4691-a7c8-2d84ec746ba9",
          manufacturer: "ford",
          model: "ka",
          registration: "HG12 3AB",
        },
      ],
    },
  );

  assertEquals(spySelectByFilter.callCount, 1);
  assert(spySelectByFilter.calledWith(
    "car",
    "_central",
    "MODEL=ka",
    true,
    { custom: "prop" },
  ));
});
