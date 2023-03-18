/**
 * Returns true if the given digest appears in the given docDigests array.
 * @param digest The digest for the operation.
 * @param docDigests The array of digests already completed for a document.
 */
export function isDigestInArray(digest: string, docDigests?: string[]) {
  if (Array.isArray(docDigests)) {
    return docDigests.includes(digest);
  }

  return false;
}
