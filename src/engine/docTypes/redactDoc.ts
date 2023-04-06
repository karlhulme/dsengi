import { DocBase } from "../../interfaces/index.ts";

/**
 * Redacts the values in a given document.  A * value indicates
 * the given redactValue should be used. A # value indicates
 * the field should be deleted.
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
    if (typeof docRecord[redactField.fieldName] !== "undefined") {
      if (redactField.value === "#") {
        delete docRecord[redactField.fieldName];
      } else {
        const newValue = redactField.value === "*"
          ? redactValue
          : redactField.value;

        docRecord[redactField.fieldName] = newValue;
      }
    }
  }
}
