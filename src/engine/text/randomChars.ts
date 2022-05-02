/**
 * Returns a sequence of random hex characters.
 * @param length A length of string to produce.
 */
export function randomChars(length: number): string {
  const numberOfBytes = Math.ceil(length / 2);

  if (numberOfBytes < 1) {
    return "";
  } else {
    const bytes = crypto.getRandomValues(new Uint8Array(numberOfBytes));
    const array = Array.from(bytes);
    const hexPairs = array.map((b) => b.toString(16).padStart(2, "0"));
    return hexPairs.join("").slice(0, length);
  }
}
