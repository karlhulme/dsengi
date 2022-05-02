import { assertEquals } from "../../../deps.ts";
import { canSelect } from "./canSelect.ts";

Deno.test("Check permission set for select permission", () => {
  assertEquals(canSelect({}, ["a", "b"]), false);
  assertEquals(canSelect({ select: false }, ["a", "b"]), false);
  assertEquals(canSelect({ select: true }, ["a", "b"]), true);
});

Deno.test("Check permission set for select permission against whitelist", () => {
  assertEquals(
    canSelect({ select: { fields: ["a"], fieldsTreatment: "include" } }, [
      "a",
      "b",
    ]),
    false,
  );
  assertEquals(
    canSelect({ select: { fields: ["a", "b"], fieldsTreatment: "include" } }, [
      "a",
      "b",
    ]),
    true,
  );
});

Deno.test("Check permission set for select permission against blacklist", () => {
  assertEquals(
    canSelect({ select: { fields: ["a"], fieldsTreatment: "exclude" } }, [
      "a",
      "b",
    ]),
    false,
  );
  assertEquals(
    canSelect({ select: { fields: ["a"], fieldsTreatment: "exclude" } }, ["b"]),
    true,
  );
});
