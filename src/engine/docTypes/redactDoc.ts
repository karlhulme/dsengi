import { DocBase } from "../../interfaces/index.ts";

/**
 * @param doc A document to be redacted.
 * @param redactFields An array of fields that should be
 * redacted that are both comformant to the field validation
 * but contain no sensitive data.
 * @param redactValue The redaction value to use when a '*' is found
 * in the redactFieldNames record.
 */
export function redactDoc<Doc extends DocBase>(
  doc: Partial<Doc>,
  redactFields: { fieldName: string; value: unknown }[],
  redactValue: string,
) {
  const docRecord = doc as unknown as Record<string, unknown>;

  for (const redactField of redactFields) {
    const newValue = redactField.value === "*"
      ? redactValue
      : redactField.value;

    if (typeof docRecord[redactField.fieldName] !== "undefined") {
      docRecord[redactField.fieldName] = newValue;
    }
  }
}
