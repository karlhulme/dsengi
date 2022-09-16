import { DocBase } from "../../interfaces/index.ts";

const DEFAULT_MAX_OP_IDS = 5;

/**
 * Append the latest operation id to the docOpIds array.
 * @param doc A doc.
 * @param opId An operation id.
 * @param maxOpIds The maximum number of operation ids to be stored in the doc.
 */
export function appendDocOpId<Doc extends DocBase>(
  doc: Partial<Doc>,
  opId: string,
  maxOpIds?: number,
): void {
  if (!Array.isArray(doc.docOpIds)) {
    doc.docOpIds = [];
  }

  while (
    doc.docOpIds.length >= (maxOpIds || DEFAULT_MAX_OP_IDS)
  ) {
    doc.docOpIds.splice(0, 1);
  }

  doc.docOpIds.push(opId);
}
