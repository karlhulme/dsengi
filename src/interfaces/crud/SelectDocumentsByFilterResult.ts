import { DocBase } from "../doc/index.ts";

/**
 * Defines the shape of the response following a request to
 * select documents using a filter.
 */
export interface SelectDocumentsByFilterResult<Doc extends DocBase> {
  /**
   * An array of documents.
   */
  docs: Partial<Doc>[];
}
