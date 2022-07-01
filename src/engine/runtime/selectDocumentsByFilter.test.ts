// deno-lint-ignore-file require-await
import { assert, assertEquals, assertRejects, spy } from "../../../deps.ts";
import {
  SengiFilterParamsValidationFailedError,
} from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

function defaultImplementation(params: string) {
  return `MODEL=${params}`;
}

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
    await sengi.selectDocumentsByFilter<Car, string>({
      ...defaultRequestProps,
      validateParams: () => {},
      implementation: defaultImplementation,
      filterParams: "ka",
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
    { custom: "prop" },
  ));
});

Deno.test("Fail to select documents if filter parameters are invalid.", async () => {
  const { sengi } = createSengiWithMockStore({
    selectByFilter: async () => ({
      docs: [{
        id: "06151119-065a-4691-a7c8-2d84ec746ba9",
        manufacturer: "ford",
        model: "ka",
        registration: "HG12 3AB",
      }],
    }),
  });

  await assertRejects(() =>
    sengi.selectDocumentsByFilter<Car, string>({
      ...defaultRequestProps,
      validateParams: () => {
        return "invalid params";
      },
      implementation: defaultImplementation,
      filterParams: "ka",
    }), SengiFilterParamsValidationFailedError);
});
