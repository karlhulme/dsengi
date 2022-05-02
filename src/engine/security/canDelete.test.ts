import { assertEquals } from "../../../deps.ts";
import { canDelete } from "./canDelete.ts";

Deno.test("Check permission set for delete permission", () => {
  assertEquals(canDelete({}), false);
  assertEquals(canDelete({ delete: false }), false);
  assertEquals(canDelete({ delete: true }), true);
});
