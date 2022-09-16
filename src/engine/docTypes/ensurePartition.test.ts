import { assertEquals, assertThrows } from "../../../deps.ts";
import { ensurePartition } from "./ensurePartition.ts";

Deno.test("A doc type using a single partition should return the central partition.", () => {
  assertEquals(ensurePartition(null, "_central", true), "_central");
});

Deno.test("A doc type using a single partition rejects a chosen partition.", () => {
  assertThrows(() => ensurePartition("choice", "_central", true));
});

Deno.test("A doc type using multiple partitions should return the given partition.", () => {
  assertEquals(ensurePartition("choice", "_central"), "choice");
});

Deno.test("A doc type using multiple partitions rejects a null partition.", () => {
  assertThrows(() => ensurePartition(null, "_central"));
});
