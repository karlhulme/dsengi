import { assertThrows } from "../../../deps.ts";
import { Sengi } from "./Sengi.ts";
import { Car, createMockStore } from "./shared.test.ts";

Deno.test("Fail to create a Sengi if no parameters are provided, because we need a docstore.", () => {
  assertThrows(
    () => new Sengi(),
    Error,
    "Must supply a docStore.",
  );
});

Deno.test("Fail to create a Sengi if no doc store is provided.", () => {
  assertThrows(
    () => new Sengi({}),
    Error,
    "Must supply a docStore.",
  );
});

Deno.test("Create a Sengi using a mock doc store and the default functions which are then invoked as a result of creating a doc.", async () => {
  const sengi = new Sengi({
    docStore: createMockStore(),
    docTypes: [{
      name: "car",
      readOnlyFieldNames: [],
      validateDoc: () => {},
      validateFields: () => {},
    }],
  });

  await sengi.newDocument<Car>({
    docTypeName: "car",
    doc: {
      id: "d7fe060b-2d03-46e2-8cb5-ab18380790d1",
      manufacturer: "Ford",
      model: "ka",
    },
    docStoreParams: { custom: "props" },
    partition: "_central",
    userId: "me",
  });
});
