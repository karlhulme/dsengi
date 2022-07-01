/**
 * Converts a type such that all the properties
 * are both nullable and omittable.
 */
export type PartialNullable<T> = { [K in keyof T]?: T[K] | null };
