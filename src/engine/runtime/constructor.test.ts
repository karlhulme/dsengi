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
      docStoreParams: { custom: "props" },
      redactFieldNames: {},
      validateDoc: () => {},
      validateFields: () => {},
      newId: () => "abcd",
      changeFieldNames: [],
      trackChanges: false,
      storePatches: false,
    }],
    patchDocStoreParams: { custom: "patch-props" },
  });

  await sengi.newDocument<Car>({
    docTypeName: "car",
    operationId: "00000000-0000-0000-0000-111122223333",
    doc: {
      manufacturer: "Ford",
      model: "ka",
    },
    partition: "_central",
    userId: "me",
  });
});
