import {
  Client,
  SengiUnrecognisedApiKeyError,
} from "../../interfaces/index.ts";
import { AuthenticatedClient } from "./AuthenticatedClient.ts";

/**
 * Raises an error if the given api key does not map to a client.
 * @param apiKey An api key.
 * @param clients An array of clients.
 */
export function ensureClient(
  apiKey: string,
  clients: Client[],
): AuthenticatedClient {
  for (const client of clients) {
    if (client.apiKeys.includes(apiKey)) {
      return {
        name: client.name,
        docPermissions: client.docPermissions,
      };
    }
  }

  throw new SengiUnrecognisedApiKeyError();
}
