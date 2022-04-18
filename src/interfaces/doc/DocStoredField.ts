/**
 * Represents a field on a stored document which can be any
 * of the usual types but cannot be null.
 */
export type DocStoredField =
  | string
  | number
  | boolean
  | Array<unknown>
  | Record<string, unknown>;
