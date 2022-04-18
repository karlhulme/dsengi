import { DocStoredField } from "./DocStoredField.ts";

/**
 * Represents a document that can contain any set of properties.
 * This can be used by document stores to build results without
 * knowledge of the specialised types that are used by docType
 * definitions.
 */
export type DocRecord = Record<string, DocStoredField>;
