import { assertEquals } from "../../../deps.ts";
import { canQuery } from "./canQuery.ts";

Deno.test("Check permission set for query permission", () => {
  assertEquals(canQuery({}, "someQuery"), false);
  assertEquals(canQuery({ select: false }, "someQuery"), false);
  assertEquals(canQuery({ select: true }, "someQuery"), true);
  assertEquals(
    canQuery({
      select: { fields: [], fieldsTreatment: "exclude", queries: [] },
    }, "someQuery"),
    false,
  );
  assertEquals(
    canQuery({
      select: {
        fields: [],
        fieldsTreatment: "exclude",
        queries: ["someQuery"],
      },
    }, "someQuery"),
    true,
  );
});
