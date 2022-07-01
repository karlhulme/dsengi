import { assertEquals } from "../../../deps.ts";
import { DocBase } from "../../interfaces/index.ts";
import { subsetDoc } from "./subsetDoc.ts";

interface ExampleDoc extends DocBase {
  propA: string;
  propB: number;
}

Deno.test("Partial document is returned with only the specified fields.", () => {
  assertEquals(
    subsetDoc<ExampleDoc>(
      {
        propA: "foo",
        propB: 12,
      },
      ["propA"],
    ),
    {
      propA: "foo",
    },
  );
});

Deno.test("Empty document is returned if no fields specified.", () => {
  assertEquals(
    subsetDoc<ExampleDoc>(
      {
        propA: "foo",
        propB: 12,
      },
      [],
    ),
    {},
  );
});
