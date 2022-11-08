import { DocBase } from "../../interfaces/index.ts";

const DEFAULT_MAX_DIGESTS = 5;

/**
 * Append the latest digest to the docDigests array.
 * @param doc A doc.
 * @param digest A digest.
 * @param maxDigests The maximum number of digests to be stored in the doc.
 */
export function appendDocDigest<Doc extends DocBase>(
  doc: Partial<Doc>,
  digest: string,
  maxDigests?: number,
): void {
  if (!Array.isArray(doc.docDigests)) {
    doc.docDigests = [];
  }

  while (
    doc.docDigests.length >= (maxDigests || DEFAULT_MAX_DIGESTS)
  ) {
    doc.docDigests.splice(0, 1);
  }

  doc.docDigests.push(digest);
}
