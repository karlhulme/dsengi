import { assertEquals, assertNotEquals } from "../../../deps.ts";
import { randomChars } from "./randomChars.ts";

Deno.test("Random chars will return the requested number of characters.", () => {
  assertEquals(randomChars(-1).length, 0);
  assertEquals(randomChars(0).length, 0);
  assertEquals(randomChars(1).length, 1);
  assertEquals(randomChars(2).length, 2);
  assertEquals(randomChars(3).length, 3);
  assertEquals(randomChars(10).length, 10);
  assertEquals(randomChars(15).length, 15);
  assertEquals(randomChars(20).length, 20);
});

Deno.test("Random chars will return different characters each time.", () => {
  assertNotEquals(randomChars(10), randomChars(10));
});
