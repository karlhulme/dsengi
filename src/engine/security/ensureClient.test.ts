import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  Client,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import { ensureClient } from "./ensureClient.ts";

const clients: Client[] = [{
  name: "aClient",
  docPermissions: true,
  apiKeys: ["adminKey"],
}];

Deno.test("Can find a valid client.", () => {
  assertEquals(ensureClient("adminKey", clients), {
    name: "aClient",
    docPermissions: true,
  });
});

Deno.test("Error raised if client cannot be found based on api key.", () => {
  assertThrows(
    () => ensureClient("unknown", clients),
    SengiUnrecognisedApiKeyError,
  );
});
