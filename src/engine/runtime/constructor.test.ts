import { assertEquals, assertThrows } from "../../../deps.ts";
import { Sengi } from "./Sengi.ts";
import { createMockStore } from "./shared.test.ts";

Deno.test("Fail to create a Sengi if a doc store is not provided.", () => {
  assertThrows(() => new Sengi({}), Error, "Must supply a docStore.");
});

Deno.test("Create a sengi with a client that uses environment variable based api keys.", () => {
  Deno.env.set("ADMIN_PRIMARY_KEY", "aaaa");
  Deno.env.set("ADMIN_SECONDARY_KEY", "bbbb");

  const sengi = new Sengi({
    clients: [{
      name: "admin",
      docPermissions: true,
      apiKeys: ["$ADMIN_PRIMARY_KEY", "$ADMIN_SECONDARY_KEY"],
    }],
    docStore: createMockStore(),
  });

  assertEquals(sengi.getApiKeysLoadedFromEnvCount(), 2);
  assertEquals(sengi.getApiKeysNotFoundInEnvCount(), 0);
});

Deno.test("Create a sengi with a client that uses environment variable based api keys that do not exist.", () => {
  const sengi = new Sengi({
    clients: [{
      name: "admin",
      docPermissions: true,
      apiKeys: [
        "$ADMIN_NON_EXISTENT_PRIMARY_KEY",
        "$ADMIN_NON_EXISTENT_SECONDARY_KEY",
      ],
    }],
    docStore: createMockStore(),
  });

  assertEquals(sengi.getApiKeysLoadedFromEnvCount(), 0);
  assertEquals(sengi.getApiKeysNotFoundInEnvCount(), 2);
});
