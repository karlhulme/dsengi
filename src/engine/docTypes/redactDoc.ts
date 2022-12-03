import { DocBase } from "../../interfaces/index.ts";

/**
 * @param doc A document to be redacted.
 * @param redactFieldNames A record that matches field names with values
 * that are both comformant to the field validation but contain no
 * sensitive data.
 * @param redactValue The redaction value to use when a '*' is found
 * in the redactFieldNames record.
 */
export function redactDoc<Doc extends DocBase>(
  doc: Partial<Doc>,
  redactFieldNames: Record<string, unknown>,
  redactValue: string,
) {
  const docRecord = doc as unknown as Record<string, unknown>;

  for (const redactFieldName in redactFieldNames) {
    const newValue = redactFieldNames[redactFieldName] === "*"
      ? redactValue
      : redactFieldNames[redactFieldName];

    if (typeof docRecord[redactFieldName] !== "undefined") {
      docRecord[redactFieldName] = newValue;
    }
  }
}
