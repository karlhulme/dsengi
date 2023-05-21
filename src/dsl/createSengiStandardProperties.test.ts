import { createSengiStandardProperties } from "./createSengiStandardProperties.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("Ensure that expected number of standard properties is produced.", () => {
  const sengiStandardProperties = createSengiStandardProperties("test");
  assertEquals(sengiStandardProperties.length, 12);
});
