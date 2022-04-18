/**
 * Defines a set of selectable fields.
 */
export interface ClientDocSelectPermissionSet {
  /**
   * Specifies if the listed fields are the only fields that can be
   * selected (i.e. include) or whether the client can query for
   * all fields except those listed (i.e. exclude).
   */
  fieldsTreatment: "include" | "exclude";

  /**
   * A list of field names.
   */
  fields: string[];

  /**
   * A list of the queries that a client may invoke.
   */
  queries?: string[];
}
