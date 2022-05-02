import { assertEquals } from "../../../deps.ts";
import { canReplace } from "./canReplace.ts";

Deno.test("Check permission set for replace permission", () => {
  assertEquals(canReplace({}), false);
  assertEquals(canReplace({ replace: false }), false);
  assertEquals(canReplace({ replace: true }), true);
});
