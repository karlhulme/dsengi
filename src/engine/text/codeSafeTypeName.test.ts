import { assertEquals } from "../../../deps.ts";
import { codeSafeTypeName } from "./codeSafeTypeName.ts";

Deno.test("Code safe version of type names.", () => {
  assertEquals(codeSafeTypeName("hello"), "hello");
  assertEquals(codeSafeTypeName("hello.world"), "world");
  assertEquals(codeSafeTypeName(""), "");
});
