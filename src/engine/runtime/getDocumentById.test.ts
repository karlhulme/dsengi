// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";
import { SengiDocNotFoundError } from "../../interfaces/index.ts";

Deno.test("Get document by id and doc is found.", async () => {
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
    await sengi.getDocumentById<Car>({
      ...defaultRequestProps,
      id: "06151119-065a-4691-a7c8-2d84ec746ba9",
    }),
    {
      doc: {
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      },
    },
  );

  assertEquals(spySelectByIds.callCount, 1);
  assert(
    spySelectByIds.calledWith(
      "car",
      "_central",
      ["06151119-065a-4691-a7c8-2d84ec746ba9"],
      { custom: "prop" },
    ),
  );
});

Deno.test("Get document by id but doc is not found.", async () => {
  const { sengi } = createSengiWithMockStore({
    selectByIds: async () => ({
      docs: [],
    }),
  });

  assertRejects(
    () =>
      sengi.getDocumentById<Car>({
        ...defaultRequestProps,
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
      }),
    SengiDocNotFoundError,
  );
});
