/**
 * Represents an action performed on a document that
 * has led to a document being changed.
 * Note that REPLACE is not one of the actions.
 */
export type DocChangeAction = "archive" | "create" | "delete" | "patch";
