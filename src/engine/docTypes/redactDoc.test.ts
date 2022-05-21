import { assertEquals } from "../../../deps.ts";
import { redactDoc } from "./redactDoc.ts";

Deno.test("Partial document is returned with only the specified fields.", () => {
  const doc = {
    id: "123",
    foo: "bar",
    hidden: "value",
  };

  assertEquals(
    redactDoc(
      doc,
      ["id", "foo"],
    ),
    {
      id: "123",
      foo: "bar",
    },
  );
});

Deno.test("Empty document is returned if no fields specified.", () => {
  const doc = {
    id: "123",
    foo: "bar",
    hidden: "value",
  };

  assertEquals(
    redactDoc(
      doc,
      [],
    ),
    {},
  );
});
