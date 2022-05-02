import { assertEquals } from "../../../deps.ts";
import { createSengiWithMockStore } from "./shared.test.ts";

Deno.test("Fetch the singular doc type name from the plural name.", () => {
  const { sengi } = createSengiWithMockStore();
  assertEquals(sengi.getDocTypeNameFromPluralName("cars"), "car");
  assertEquals(sengi.getDocTypeNameFromPluralName("unknowns"), null);
});

Deno.test("Fetch the plural doc type name from the singular name.", () => {
  const { sengi } = createSengiWithMockStore();
  assertEquals(sengi.getDocTypePluralNameFromName("car"), "cars");
  assertEquals(sengi.getDocTypePluralNameFromName("unknown"), null);
});
