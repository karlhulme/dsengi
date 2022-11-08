import { assertEquals } from "../../../deps.ts";
import { isDigestInArray } from "./isDigestInArray.ts";

Deno.test("Find digests that are in the array", () => {
  assertEquals(isDigestInArray("abc", ["abc", "def"]), true);
});

Deno.test("Do not find digests that are not in the array", () => {
  assertEquals(isDigestInArray("ghi", ["abc", "def"]), false);
});

Deno.test("Do not find digests if there is no array", () => {
  assertEquals(isDigestInArray("ghi"), false);
});
