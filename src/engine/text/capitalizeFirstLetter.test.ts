import { assertEquals } from "../../../deps.ts";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.ts";

Deno.test("First letter of a string can be capitalised.", () => {
  assertEquals(capitalizeFirstLetter("hello"), "Hello");
  assertEquals(capitalizeFirstLetter("h"), "H");
  assertEquals(capitalizeFirstLetter(""), "");
});
