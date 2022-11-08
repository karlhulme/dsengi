import { assertEquals } from "../../../deps.ts";
import { createDigest } from "./createDigest.ts";

Deno.test("Generate a digest for a create operation with params and a sequence number.", async () => {
  const result = await createDigest(
    "00000000-0000-0000-0000-000000001111",
    "create",
    { foo: "bar" },
    "1",
  );

  assertEquals(
    result,
    "1111:C1:bd792e0f86b119f8e5b484b0b5db4ae4efcdb8dd",
  );
});

Deno.test("Generate a digest for an archive operation without any params or sequence number.", async () => {
  const result = await createDigest(
    "00000000-0000-0000-0000-000000001111",
    "archive",
  );

  assertEquals(
    result,
    "1111:A0:1943fee0fe27c2c2040aa61ec0c51eab2319e651",
  );
});

Deno.test("Generate a digest for a patch operation with just params but no sequence number.", async () => {
  const result = await createDigest(
    "00000000-0000-0000-0000-000000002222",
    "create",
    { hello: "world" },
  );

  assertEquals(
    result,
    "2222:C0:29f4d90d617bd3e8edbdb598f7d285ed37ae0013",
  );
});
