import { assertThrows } from "../../../deps.ts";
import { AuthenticatedClient } from "./AuthenticatedClient.ts";
import {
  ensureCreatePermission,
  ensureDeletePermission,
  ensureOperatePermission,
  ensurePatchPermission,
  ensureQueryPermission,
  ensureReplacePermission,
  ensureSelectPermission,
} from "./ensurePermissions.ts";

const adminAuthenticatedClient: AuthenticatedClient = {
  name: "admin",
  docPermissions: {
    testDocType: {
      create: true,
      delete: true,
      select: {
        fields: ["a", "b"],
        fieldsTreatment: "include",
        queries: ["someQuery"],
      },
      update: {
        operations: ["someOp"],
        patch: true,
      },
      replace: true,
    },
  },
};

const guestAuthenticatedClient: AuthenticatedClient = {
  name: "guest",
  docPermissions: false,
};

Deno.test("Silently return if checked permission is held.", () => {
  ensureCreatePermission(adminAuthenticatedClient, "testDocType");
  ensureDeletePermission(adminAuthenticatedClient, "testDocType");
  ensureOperatePermission(adminAuthenticatedClient, "testDocType", "someOp");
  ensurePatchPermission(adminAuthenticatedClient, "testDocType");
  ensureQueryPermission(adminAuthenticatedClient, "testDocType", "someQuery");
  ensureReplacePermission(adminAuthenticatedClient, "testDocType");
  ensureSelectPermission(adminAuthenticatedClient, "testDocType", ["a", "b"]);
});

Deno.test("Raise error if checked permission is not held.", () => {
  assertThrows(() =>
    ensureCreatePermission(guestAuthenticatedClient, "testDocType")
  );
  assertThrows(() =>
    ensureDeletePermission(guestAuthenticatedClient, "testDocType")
  );
  assertThrows(() =>
    ensureOperatePermission(guestAuthenticatedClient, "testDocType", "someOp")
  );
  assertThrows(() =>
    ensurePatchPermission(guestAuthenticatedClient, "testDocType")
  );
  assertThrows(() =>
    ensureQueryPermission(guestAuthenticatedClient, "testDocType", "someQuery")
  );
  assertThrows(() =>
    ensureReplacePermission(guestAuthenticatedClient, "testDocType")
  );
  assertThrows(() =>
    ensureSelectPermission(guestAuthenticatedClient, "testDocType", ["a", "b"])
  );
});
