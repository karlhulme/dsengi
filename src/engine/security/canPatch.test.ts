import { assertEquals } from "../../../deps.ts";
import { canPatch } from "./canPatch.ts";

Deno.test("Check permission set for patch permission", () => {
  assertEquals(canPatch({}), false);
  assertEquals(canPatch({ update: false }), false);
  assertEquals(canPatch({ update: true }), true);
  assertEquals(canPatch({ update: { patch: false, operations: [] } }), false);
  assertEquals(canPatch({ update: { patch: true, operations: [] } }), true);
});
