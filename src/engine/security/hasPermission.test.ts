import { assertEquals } from "../../../deps.ts";
import { hasPermission } from "./hasPermission.ts";
import { canCreate } from "./canCreate.ts";

Deno.test("Permission is confirmed if client has system wide permission.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: true,
      },
      "testDocType",
      canCreate,
    ),
    true,
  );
});

Deno.test("Permission is confirmed if client has doc wide permission.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: {
          testDocType: true,
        },
      },
      "testDocType",
      canCreate,
    ),
    true,
  );
});

Deno.test("Permission is found if client has operation specific permission.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: {
          testDocType: {
            create: true,
          },
        },
      },
      "testDocType",
      canCreate,
    ),
    true,
  );
});

Deno.test("Permission is not found if client does not have any permissions.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: false,
      },
      "testDocType",
      canCreate,
    ),
    false,
  );
});

Deno.test("Permission is not found if client does not have any permissions on the doc type.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: {
          testDocType: false,
        },
      },
      "testDocType",
      canCreate,
    ),
    false,
  );
});

Deno.test("Permission is not found if client does not have any operation specific permission.", () => {
  assertEquals(
    hasPermission(
      {
        name: "test",
        docPermissions: {
          testDocType: {
            create: false,
          },
        },
      },
      "testDocType",
      canCreate,
    ),
    false,
  );
});
