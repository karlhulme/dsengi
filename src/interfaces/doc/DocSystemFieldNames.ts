/**
 * Defines the field names that must be defined on all document types.
 */
export const DocSystemFieldNames = [
  /**
   * 'id' is required for the document to save.
   */
  "id",

  /**
   * 'docType' must be provided for the document to save and query.
   * Similar to id, this field is mandatory.
   */
  "docType",

  /**
   * 'docStatus' must be provided for the document to save and query.
   * It takes a value of 'active' or 'archived'.
   */
  "docStatus",

  /**
   * 'docVersion' is required when retrieving a document so the doc store
   * will need to produce one.  Otherwise it is largely ignored by the
   * save pipeline.  Upon saving, the store should either:
   * (i) Generate a new docVersion
   * (ii) Remove the docVersion from the document on the grounds that the
   * underlying database will assign something (e.g. an eTag) instead.  In
   * this case, the document store should also allow that underlying
   * version to be queried as 'docVersion' and insert it into any retrieved
   * documents.
   */
  "docVersion",

  /**
   * 'docOpIds' stores an array of operation ids that can be used to find
   * all the documents that have been amended as a consequence of a single
   * operation.
   */
  "docOpIds",

  /**
   * 'docDigests' stores an array of digests that are used to prevent
   * the same mutation from being applied multiple times.  You can specify
   * as part of the policy of a document type how many document digests
   * to store.
   */
  "docDigests",

  /**
   * 'docCreatedByUserId' stores the id of the user that created the document.
   */
  "docCreatedByUserId",

  /**
   * 'docCreatedMillisecondsSinceEpoch' stores the number of milliseconds since
   * the unix epoch when the document was created.
   */
  "docCreatedMillisecondsSinceEpoch",

  /**
   * 'docLastUpdatedByUserId' stores the id of the user that last updated the document.
   */
  "docLastUpdatedByUserId",

  /**
   * 'docLastUpdatedMillisecondsSinceEpoch' stores the number of milliseconds since
   * the unix epoch when the document was last updated.
   */
  "docLastUpdatedMillisecondsSinceEpoch",

  /**
   * 'docArchivedByUserId' stores the id of the user that archived the document.
   */
  "docArchivedByUserId",

  /**
   * 'docArchivedMillisecondsSinceEpoch' stores the number of milliseconds since
   * the unix epoch when the document was archived.
   */
  "docArchivedMillisecondsSinceEpoch",
];
