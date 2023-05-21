import { assertStrictEquals } from "../../deps.ts";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.ts";

Deno.test("Capitalise first letter of a string.", () => {
  assertStrictEquals(capitalizeFirstLetter("test"), "Test");
});

Deno.test("Accept empty string.", () => {
  assertStrictEquals(capitalizeFirstLetter(""), "");
});
