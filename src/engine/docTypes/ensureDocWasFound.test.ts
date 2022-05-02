import { assertEquals, assertThrows } from "../../../deps.ts";
import { SengiDocNotFoundError } from "../../interfaces/index.ts";
import { ensureDocWasFound } from "./ensureDocWasFound.ts";

Deno.test("A found doc should not raise an error.", () => {
  assertEquals(ensureDocWasFound("test", "123", {}), {});
});

Deno.test("A doc that was not found should raise an error.", () => {
  assertThrows(
    () => ensureDocWasFound("test", "123", null),
    SengiDocNotFoundError,
    "not found",
  );
});
