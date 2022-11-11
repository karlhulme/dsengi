import { assertEquals } from "../../../deps.ts";
import { subsetOfDocStoreRecord } from "./subsetOfDocStoreRecord.ts";

Deno.test("Build subset of doc store record.", () => {
  assertEquals(
    subsetOfDocStoreRecord({
      foo: "bar",
      hello: "world",
    }, [
      "foo",
      "madeup",
    ]),
    {
      foo: "bar",
    },
  );
});
