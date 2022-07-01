// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

Deno.test("Select by document ids.", async () => {
  const { sengi, docStore } = createSengiWithMockStore({
    selectByIds: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  });

  const spySelectByIds = spy(docStore, "selectByIds");

  assertEquals(
    await sengi.selectDocumentsByIds<Car>({
      ...defaultRequestProps,
      fieldNames: ["id", "model"], // the test doc store 'selectByIds' implementation above will not respect this
      ids: ["06151119-065a-4691-a7c8-2d84ec746ba9"],
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

  assertEquals(spySelectByIds.callCount, 1);
  assert(
    spySelectByIds.calledWith(
      "car",
      "_central",
      ["id", "model"],
      ["06151119-065a-4691-a7c8-2d84ec746ba9"],
      { custom: "prop" },
    ),
  );
});
