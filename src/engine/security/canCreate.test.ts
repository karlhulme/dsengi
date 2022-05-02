import { assertEquals } from "../../../deps.ts";
import { canCreate } from "./canCreate.ts";

Deno.test("Check permission set for create permission", () => {
  assertEquals(canCreate({}), false);
  assertEquals(canCreate({ create: false }), false);
  assertEquals(canCreate({ create: true }), true);
});
