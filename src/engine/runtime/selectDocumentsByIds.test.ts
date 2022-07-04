// deno-lint-ignore-file require-await
import { assert, assertEquals, spy } from "../../../deps.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
  sleep,
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
      ["06151119-065a-4691-a7c8-2d84ec746ba9"],
      { custom: "prop" },
    ),
  );
});

Deno.test("Select by document ids using the cache.", async () => {
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

  await sengi.selectDocumentsByIds<Car>({
    ...defaultRequestProps,
    ids: ["06151119-065a-4691-a7c8-2d84ec746ba9"],
    cacheMilliseconds: 500,
  });

  await sengi.selectDocumentsByIds<Car>({
    ...defaultRequestProps,
    ids: ["06151119-065a-4691-a7c8-2d84ec746ba9"],
    cacheMilliseconds: 500,
  });

  // Wait longer enough for the timeouts on the cache to expire
  // so that the test runner doesn't detect a leak.
  await sleep(1500);

  // Only 1 request expected, as second request served from cache.
  assertEquals(spySelectByIds.callCount, 1);
});
