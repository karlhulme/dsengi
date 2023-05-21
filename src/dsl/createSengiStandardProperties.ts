import { RecordTypeDefProperty } from "../../deps.ts";

/*
 * We use very common types for document ids and user ids because
 * we don't know if uuids will be used or something sequential
 * in the form "type_datebit_random" or something else entirely.
 */

/**
 * Returns an array of record type def properties that need to be
 * defined for any record that is used to define a Sengi document.
 * @param docTypeName The name of a document type.
 */
export function createSengiStandardProperties(docTypeName: string) {
  return [
    generateDocIdProperty(),
    generateDocTypeProperty(docTypeName),
    generateDocStatusProperty(),
    generateDocOpIdsProperty(),
    generateDocDigestsProperty(),
    generateDocVersionProperty(),
    generateDocCreatedByUserId(),
    generateDocCreatedMillisecondsSinceEpoch(),
    generateDocLastUpdatedByUserId(),
    generateDocLastUpdatedMillisecondsSinceEpoch(),
    generateDocArchivedByUserId(),
    generateDocArchivedMillisecondsSinceEpoch(),
  ];
}

/**
 * Returns a Sengi id property definition.
 */
export function generateDocIdProperty(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "id",
    summary: "The globally unique id for the document.",
    propertyType: "std/mediumString",
    isRequired: true,
  };
}

/**
 * Returns a Sengi docType property definition.
 * @param docTypeName The name of the docType to which this property
 * will be applied.  It is used as the only accepted constant value
 * of this property.
 */
export function generateDocTypeProperty(
  docTypeName: string,
): RecordTypeDefProperty<"std/mediumString"> {
  return {
    name: "docType",
    summary: "The name of the document type.",
    propertyType: "std/mediumString",
    constant: docTypeName,
    isRequired: true,
  };
}

/**
 * Returns a Sengi docStatus property definition.
 */
export function generateDocStatusProperty(): RecordTypeDefProperty<
  "std/shortString"
> {
  return {
    name: "docStatus",
    summary: "The status of the document, either active or archived.",
    propertyType: "std/shortString",
    isRequired: true,
  };
}

/**
 * Returns a Sengi docOpIds property definition.
 */
export function generateDocOpIdsProperty(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docOpIds",
    summary: "The ids of the recently completed operations.",
    propertyType: "std/mediumString",
    isArray: true,
    isRequired: true,
  };
}

/**
 * Returns a Sengi docDigests property definition.
 */
export function generateDocDigestsProperty(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docDigests",
    summary: "The digests of the recently completed operations.",
    propertyType: "std/mediumString",
    isArray: true,
    isRequired: true,
  };
}

/**
 * Returns a Sengi docVersion property definition.
 */
export function generateDocVersionProperty(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docVersion",
    summary: "The unique version assigned to a document.",
    propertyType: "std/mediumString",
    isRequired: true,
  };
}

/**
 * Returns a Sengi createdByUserId property definition.
 */
export function generateDocCreatedByUserId(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docCreatedByUserId",
    summary: "The id of the user that created the document.",
    propertyType: "std/mediumString",
    isRequired: true,
  };
}

/**
 * Returns a Sengi createdByMillisecondsSinceEpoch property definition.
 */
export function generateDocCreatedMillisecondsSinceEpoch(): RecordTypeDefProperty<
  "std/timestamp"
> {
  return {
    name: "docCreatedMillisecondsSinceEpoch",
    summary:
      "The number of milliseconds since the epoch when the document was created.",
    propertyType: "std/timestamp",
    isRequired: true,
  };
}

/**
 * Returns a Sengi lastUpdatedByUserId property definition.
 */
export function generateDocLastUpdatedByUserId(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docLastUpdatedByUserId",
    summary: "The id of the user that last updated the document.",
    propertyType: "std/mediumString",
    isRequired: true,
  };
}

/**
 * Returns a Sengi lastUpdatedByMillisecondsSinceEpoch property definition.
 */
export function generateDocLastUpdatedMillisecondsSinceEpoch(): RecordTypeDefProperty<
  "std/timestamp"
> {
  return {
    name: "docLastUpdatedMillisecondsSinceEpoch",
    summary:
      "The number of milliseconds since the epoch when the document was last updated.",
    propertyType: "std/timestamp",
    isRequired: true,
  };
}

/**
 * Returns a Sengi archivedByUserId property definition.
 */
export function generateDocArchivedByUserId(): RecordTypeDefProperty<
  "std/mediumString"
> {
  return {
    name: "docArchivedByUserId",
    summary: "The id of the user that archived the document.",
    propertyType: "std/mediumString",
  };
}

/**
 * Returns a Sengi archivedMillisecondsSinceEpoch property definition.
 */
export function generateDocArchivedMillisecondsSinceEpoch(): RecordTypeDefProperty<
  "std/timestamp"
> {
  return {
    name: "docArchivedMillisecondsSinceEpoch",
    summary:
      "The number of milliseconds since the epoch when the document was archived.",
    propertyType: "std/timestamp",
  };
}
