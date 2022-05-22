/**
 * Defines the field names that must be defined on all document types.
 */
export const DocSystemFieldNames = [
  /**
   * 'id' must be provided for the document to save.  The id must also
   * be provided by the doc store when it returns a document.
   */
  "id",

  /**
   * 'docType' must be provided for the document to save and query.
   * Similar to id, this field is mandatory.
   */
  "docType",

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
   * 'docOpsIds' stores an array of operation ids that is used to prevent
   * the same operation from being applied multiple times.  You can specify
   * as part of the policy of a document type how many document operation ids
   * to store.
   */
  "docOpIds",

  /**
   * 'docCreatedByUserId' stores the id of the user that created the document.
   * A function passed to the Sengi constructor informs the engine how to
   * extract the user id from a user object.
   */
  "docCreatedByUserId",

  /**
   * 'docCreatedMillisecondsSinceEpoch' stores the number of milliseconds since
   * the unix epoch when the document was created.
   */
  "docCreatedMillisecondsSinceEpoch",

  /**
   * 'docLastUpdatedByUserId' stores the id of the user that last updated the document.
   * A function passed to the Sengi constructor informs the engine how to
   * extract the user id from a user object.
   */
  "docLastUpdatedByUserId",

  /**
   * 'docLastUpdatedMillisecondsSinceEpoch' stores the number of milliseconds since
   * the unix epoch when the document was last updated.
   */
  "docLastUpdatedMillisecondsSinceEpoch",
];
