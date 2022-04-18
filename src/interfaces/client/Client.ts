import { ClientDocPermissionSet } from "./ClientDocPermissionSet.ts";

/**
 * Represents a client that is permitted to execute operations on the sengi engine.
 */
export interface Client {
  /**
   * The name of the client.
   */
  name: string;

  /**
   * The api keys assigned to the client.  Each key can be a string literal
   * or it can be an environment variable by prefixing it with a dollar ($) sign.
   */
  apiKeys: string[];

  /**
   * The permission sets awarded to this client.
   */
  docPermissions: boolean | Record<string, boolean | ClientDocPermissionSet>;
}
