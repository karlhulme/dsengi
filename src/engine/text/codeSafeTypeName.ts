/**
 * Returns the portion of text that appears after the last period.
 * @param text A type name.
 */
export function codeSafeTypeName(text: string): string {
  const lastPeriodIndex = text.lastIndexOf(".");

  if (lastPeriodIndex === -1) {
    return text;
  } else {
    return text.slice(lastPeriodIndex + 1);
  }
}
