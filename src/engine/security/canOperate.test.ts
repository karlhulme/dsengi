import { assertEquals } from "../../../deps.ts";
import { canOperate } from "./canOperate.ts";

Deno.test("Check permission set for operate permission", () => {
  assertEquals(canOperate({}, "someOp"), false);
  assertEquals(canOperate({ update: false }, "someOp"), false);
  assertEquals(canOperate({ update: true }, "someOp"), true);
  assertEquals(canOperate({ update: { operations: [] } }, "someOp"), false);
  assertEquals(
    canOperate({ update: { operations: ["someOp"] } }, "someOp"),
    true,
  );
});
