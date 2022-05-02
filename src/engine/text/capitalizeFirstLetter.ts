/**
 * Returns the given text string with first letter capitalised.
 * @param text A text string.
 */
export function capitalizeFirstLetter(text: string): string {
  if (typeof text === "string" && text.length > 0) {
    return text[0].toUpperCase() + text.slice(1);
  } else {
    return text;
  }
}
