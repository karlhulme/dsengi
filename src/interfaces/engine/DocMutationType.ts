/**
 * The type of document mutation.
 * This excludes replaces, which is reserved for migrating documents
 * without triggering events or validation.  You can see 'create' to
 * replace existing documents if you require event and validation
 * functionality.
 */
export type DocMutationType = "create" | "delete" | "patch" | "archive";
