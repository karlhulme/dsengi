import { User } from "./User.ts";

/**
 * Represents the properties passed to a function that authorises the
 * reading of a document.
 */
export interface DocTypeReadAuthProps<Doc> {
  /**
   * The user making the request.
   */
  user: User;

  /**
   * The type of request.
   */
  requestType: "selectDocs" | "selectByFilter" | "selectByIds";

  /**
   * A list of the fields that are to be read by the request.
   */
  fieldNames: string[];

  /**
   * The document to be read.
   */
  doc: Doc;
}
