import { TtlCache } from "../../../deps.ts";
import {
  ArchiveDocumentProps,
  ArchiveDocumentResult,
  DeleteDocumentProps,
  DeleteDocumentResult,
  DocBase,
  DocMutationType,
  DocStatuses,
  DocStore,
  DocStoreDeleteByIdResultCode,
  DocStoreRecord,
  DocStoreUpsertResultCode,
  DocType,
  DocumentChangedEventProps,
  GetDocumentByIdProps,
  GetDocumentByIdResult,
  NewDocumentProps,
  NewDocumentResult,
  PatchDocumentProps,
  PatchDocumentResult,
  QueryDocumentsProps,
  QueryDocumentsResult,
  ReplaceDocumentProps,
  ReplaceDocumentResult,
  SelectDocumentByIdProps,
  SelectDocumentByIdResult,
  SelectDocumentsByFilterProps,
  SelectDocumentsByFilterResult,
  SelectDocumentsByIdsProps,
  SelectDocumentsByIdsResult,
  SelectDocumentsProps,
  SelectDocumentsResult,
  SengiDocNotFoundError,
} from "../../interfaces/index.ts";
import { ensureUpsertSuccessful, SafeDocStore } from "../docStore/index.ts";
import { appendDocDigest } from "../docTypes/appendDocDigest.ts";
import { ensurePartition } from "../docTypes/ensurePartition.ts";
import { generateNewDocumentId } from "../docTypes/generateNewDocumentId.ts";
import {
  appendDocOpId,
  applyCommonFieldValuesToDoc,
  buildChangedFieldBlock,
  coerceQueryResult,
  createDigest,
  ensureCanDeleteDocuments,
  ensureCanFetchWholeCollection,
  ensureCanReplaceDocuments,
  ensureDocSystemFields,
  ensureDocWasFound,
  ensureRaiseChangeEventsConfig,
  ensureStorePatchesConfig,
  ensureUserId,
  executePatch,
  executeValidateDoc,
  isDigestInArray,
  selectDocTypeFromArray,
} from "../docTypes/index.ts";

/**
 * The default number of documents to cache that have been retrieved by id.
 */
const DEFAULT_CACHE_SIZE = 500;

/**
 * The default document patch name.
 */
const DEFAULT_PATCH_DOC_TYPE_NAME = "patch";

/**
 * The default document change event name.
 */
const DEFAULT_CHANGE_EVENT_DOC_TYPE_NAME = "changeEvent";

/**
 * The default central partition.
 */
const DEFAULT_CENTRAL_PARTITION_NAME = "_central";

/**
 * The properties that are used to manage the construction of a Sengi.
 */
export interface SengiConstructorProps<
  DocTypeNames extends string,
  DocStoreParams,
  Filter,
  Query,
> {
  /**
   * The document store that provides long-term storage for the sengi engine.
   */
  docStore?: DocStore<DocStoreParams, Filter, Query>;

  /**
   * The name of the central partition.
   */
  centralPartitionName?: string;

  /**
   * A function that returns the number of milliseconds since the unix epoch.
   */
  getMillisecondsSinceEpoch?: () => number;

  /**
   * A function that returns a new document version.
   */
  getNewDocVersion?: () => string;

  /**
   * An array of document types that are managed by the engine.
   */
  docTypes?: DocType<DocTypeNames, DocStoreParams>[];

  /**
   * A function that returns a validation error if the given user id is not valid.
   */
  validateUserId?: (userId: string) => string | void;

  /**
   * The number of documents to store in the cache that have been
   * retrieved by id.
   */
  cacheSize?: number;

  /**
   * The name of the doc type that stores patches.
   */
  patchDocTypeName?: string;

  /**
   * The params to be passed to the document store when attempting
   * to store a patch.
   */
  patchDocStoreParams?: DocStoreParams;

  /**
   * The name of the doc type that stores change events.
   */
  changeEventDocTypeName?: string;

  /**
   * The params to be passed to the document store when attempting
   * to store a change event.
   */
  changeEventDocStoreParams?: DocStoreParams;

  /**
   * A function that will be invoked whenever a document is archived,
   * deleted, created or patched.
   * It is not raised when documents are replaced.
   * This function is guaranteed to be invoked at least once for
   * each committed change.
   */
  documentChanged?: () => Promise<void>; // docType, id, changeType, preMutationFields, postMutationFields
}

/**
 * A sengi engine for processing selection, querying and upsertion of docs
 * to a No-SQL, document based database or backing store.
 */
export class Sengi<
  DocTypeNames extends string,
  DocStoreParams,
  Filter,
  Query,
> {
  private docTypes: DocType<DocTypeNames, DocStoreParams>[];
  private safeDocStore: SafeDocStore<
    DocStoreParams,
    Filter,
    Query
  >;
  private centralPartitionName: string;
  private validateUserId: (userId: string) => string | void;
  private getMillisecondsSinceEpoch: () => number;
  private getNewDocVersion: () => string;
  private cache: TtlCache<DocBase>;
  private patchDocTypeName: string;
  private patchDocStoreParams?: DocStoreParams;
  private changeEventDocTypeName: string;
  private changeEventDocStoreParams?: DocStoreParams;
  private documentChanged?: () => Promise<void>;

  /**
   * Creates a new Sengi engine based on a set of doc types and clients.
   * @param props The constructor properties.
   */
  constructor(
    props: SengiConstructorProps<
      DocTypeNames,
      DocStoreParams,
      Filter,
      Query
    > = {},
  ) {
    this.docTypes = props.docTypes || [];
    this.centralPartitionName = props.centralPartitionName ||
      DEFAULT_CENTRAL_PARTITION_NAME;
    this.validateUserId = props.validateUserId || (() => {});
    this.getMillisecondsSinceEpoch = props.getMillisecondsSinceEpoch ||
      (() => Date.now());
    this.getNewDocVersion = props.getNewDocVersion ||
      (() => crypto.randomUUID());

    if (!props.docStore) {
      throw new Error("Must supply a docStore.");
    }

    this.safeDocStore = new SafeDocStore(props.docStore);

    this.cache = new TtlCache<DocBase>(
      typeof props.cacheSize === "number"
        ? props.cacheSize
        : DEFAULT_CACHE_SIZE,
    );

    this.patchDocTypeName = props.patchDocTypeName ||
      DEFAULT_PATCH_DOC_TYPE_NAME;
    this.patchDocStoreParams = props.patchDocStoreParams;

    this.changeEventDocTypeName = props.changeEventDocTypeName ||
      DEFAULT_CHANGE_EVENT_DOC_TYPE_NAME;
    this.changeEventDocStoreParams = props.changeEventDocStoreParams;

    this.documentChanged = props.documentChanged;
  }

  /**
   * Archives an existing document.
   * @param props A property bag.
   */
  async archiveDocument<Doc extends DocBase>(
    props: ArchiveDocumentProps<DocTypeNames>,
  ): Promise<ArchiveDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const digest = await createDigest(props.operationId, "archive");

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    const fetchResult = await this.safeDocStore.fetch(
      props.docTypeName,
      partition,
      props.id,
      docType.docStoreParams,
    );

    const doc = ensureDocWasFound(
      props.docTypeName,
      props.id,
      fetchResult.doc as unknown as Partial<DocBase>,
    );

    const loadedDocVersion = doc.docVersion as string;

    const changeEvent = props.raiseChangeEvent
      ? await this.buildChangeEvent(
        "archive",
        props.raiseChangeEventPartition,
        docType.changeEventFieldNames,
        props.docTypeName,
        partition,
        doc,
        null,
        digest,
        props.userId,
      )
      : null;

    const isDigestProcessed = isDigestInArray(digest, doc.docDigests);

    const isAlreadyArchived = doc.docStatus === DocStatuses.Archived &&
      Boolean(doc.docArchivedByUserId) &&
      Boolean(doc.docArchivedMillisecondsSinceEpoch);

    if (!isDigestProcessed && !isAlreadyArchived) {
      applyCommonFieldValuesToDoc(
        doc,
        this.getMillisecondsSinceEpoch(),
        props.userId,
        this.getNewDocVersion(),
      );

      appendDocDigest(doc, digest, docType.policy?.maxDigests);

      appendDocOpId(doc, props.operationId, docType.policy?.maxOpIds);

      doc.docStatus = DocStatuses.Archived;
      doc.docArchivedByUserId = props.userId;
      doc.docArchivedMillisecondsSinceEpoch = this.getMillisecondsSinceEpoch();

      const result = await this.safeDocStore.upsert(
        props.docTypeName,
        partition,
        doc as unknown as DocStoreRecord,
        loadedDocVersion,
        docType.docStoreParams,
      );

      ensureUpsertSuccessful(result, false);
    }

    if (changeEvent) {
      console.log(changeEvent);
    }

    return {
      isArchived: !isAlreadyArchived,
      doc: doc as Doc,
    };
  }

  /**
   * Deletes an existing document.
   * If the document does not exist then the call succeeds but the properties on the returned
   * object indicates that a document was not actually deleted.
   * @param props A property bag.
   */
  async deleteDocument(
    props: DeleteDocumentProps<DocTypeNames>,
  ): Promise<DeleteDocumentResult> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    ensureCanDeleteDocuments(docType);

    const digest = await createDigest(props.operationId, "delete");

    const existingDoc = props.raiseChangeEvent
      ? await this.safeDocStore.fetch(
        props.docTypeName,
        partition,
        props.id,
        docType.docStoreParams,
      )
      : null;

    const changeEvent = props.raiseChangeEvent
      ? await this.buildChangeEvent(
        "delete",
        props.raiseChangeEventPartition,
        docType.changeEventFieldNames,
        props.docTypeName,
        partition,
        existingDoc?.doc || null,
        null,
        digest,
        props.userId,
      )
      : null;

    const deleteByIdResult = await this.safeDocStore.deleteById(
      props.docTypeName,
      partition,
      props.id,
      docType.docStoreParams,
    );

    if (changeEvent) {
      console.log(changeEvent);
    }

    const isDeleted =
      deleteByIdResult.code === DocStoreDeleteByIdResultCode.DELETED;

    return { isDeleted };
  }

  /**
   * Adds a new document to a collection.  This function can also be used to
   * perform an upsert by specifying an explicitId.  If you want change events
   * to be raised, then use this function rather than replaceDocument.
   * @param props A property bag.
   */
  async newDocument<Doc extends DocBase>(
    props: NewDocumentProps<DocTypeNames, Doc>,
  ): Promise<NewDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const digest = await createDigest(
      props.operationId,
      "create",
      props.doc,
      props.sequenceNo,
    );

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const id = props.explicitId || generateNewDocumentId(docType);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    const processedDocs = await this.safeDocStore.selectByDigest(
      props.docTypeName,
      partition,
      digest,
      docType.docStoreParams,
    );

    const doc = processedDocs.docs.length > 0
      ? processedDocs.docs[0] as Partial<Doc>
      : props.doc as Partial<Doc>;

    if (processedDocs.docs.length === 0) {
      doc.id = id;
      doc.docType = props.docTypeName;
      doc.docStatus = DocStatuses.Active;
      doc.docOpIds = [props.operationId];
      doc.docDigests = [digest];

      applyCommonFieldValuesToDoc(
        doc,
        this.getMillisecondsSinceEpoch(),
        props.userId,
        this.getNewDocVersion(),
      );

      executeValidateDoc(
        props.docTypeName,
        docType.validateFields,
        docType.validateDoc,
        doc as Doc,
      );

      ensureDocSystemFields(props.docTypeName, doc as Doc);
    }

    const changeEvent = props.raiseChangeEvent
      ? await this.buildChangeEvent(
        "create",
        props.raiseChangeEventPartition,
        docType.changeEventFieldNames,
        props.docTypeName,
        partition,
        doc as DocStoreRecord,
        null,
        digest,
        props.userId,
      )
      : null;

    if (processedDocs.docs.length === 0) {
      // We have created a new document so we need to upsert it.
      await this.safeDocStore.upsert(
        props.docTypeName,
        partition,
        doc as unknown as DocStoreRecord,
        null,
        docType.docStoreParams,
      );
    }

    if (changeEvent) {
      console.log(changeEvent);
    }

    return {
      doc: doc as Doc,
    };
  }

  /**
   * Patches an existing document with a merge patch.
   * Although very unlikely, it's possible that a patch is successfully
   * applied but an error is encountered when trying to write the patch
   * to the patches container.  In this circumstance it is safe to apply the patch again.
   * @param props A property bag.
   */
  async patchDocument<Doc extends DocBase>(
    props: PatchDocumentProps<DocTypeNames, Doc>,
  ): Promise<PatchDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const digest = await createDigest(
      props.operationId,
      "patch",
      props.patch,
      props.sequenceNo,
    );

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    const fetchResult = await this.safeDocStore.fetch(
      props.docTypeName,
      partition,
      props.id,
      docType.docStoreParams,
    );

    const doc = ensureDocWasFound(
      props.docTypeName,
      props.id,
      fetchResult.doc as unknown as Partial<Doc>,
    );

    const changeEvent = props.raiseChangeEvent
      ? await this.buildChangeEvent(
        "patch",
        props.raiseChangeEventPartition,
        docType.changeEventFieldNames,
        props.docTypeName,
        partition,
        doc as DocStoreRecord,
        props.patch as DocStoreRecord,
        digest,
        props.userId,
      )
      : null;

    const isDigestProcessed = isDigestInArray(digest, doc.docDigests);

    if (!isDigestProcessed) {
      const loadedDocVersion = doc.docVersion as string;

      executePatch(
        props.docTypeName,
        docType.readOnlyFieldNames,
        doc as Doc,
        props.patch,
      );

      appendDocOpId(doc, props.operationId, docType.policy?.maxOpIds);

      appendDocDigest(doc, digest, docType.policy?.maxDigests);

      applyCommonFieldValuesToDoc(
        doc,
        this.getMillisecondsSinceEpoch(),
        props.userId,
        this.getNewDocVersion(),
      );

      executeValidateDoc(
        props.docTypeName,
        docType.validateFields,
        docType.validateDoc,
        doc as Doc,
      );

      ensureDocSystemFields(props.docTypeName, doc as Doc);

      // Once all the document validations are complete, we write the
      // patch event to the patch document store (if requested).  A failure
      // at this point means we've logged a patch that wasn't applied,
      // but this is better than not having a log of a patch that was applied.
      if (props.storePatch) {
        ensureStorePatchesConfig(
          this.patchDocTypeName,
          this.patchDocStoreParams,
        );

        const patchDoc = {
          id: props.operationId,
          docType: this.patchDocTypeName!,
          patchedDocId: props.id,
          patchedDocType: props.docTypeName,
          patch: props.patch,
        };

        applyCommonFieldValuesToDoc(
          patchDoc,
          this.getMillisecondsSinceEpoch(),
          props.userId,
          this.getNewDocVersion(),
        );

        await this.safeDocStore.upsert(
          this.patchDocTypeName!,
          props.storePatchPartition || partition,
          patchDoc,
          null,
          this.patchDocStoreParams!,
        );
      }

      const upsertResult = await this.safeDocStore.upsert(
        props.docTypeName,
        partition,
        doc as unknown as DocStoreRecord,
        props.reqVersion || loadedDocVersion,
        docType.docStoreParams,
      );

      ensureUpsertSuccessful(upsertResult, Boolean(props.reqVersion));
    }

    if (changeEvent) {
      console.log(changeEvent);
    }

    return {
      doc: doc as Doc,
    };
  }

  /**
   * Executes a query across a set of documents.
   * @param props A property bag.
   */
  async queryDocuments<QueryResult>(
    props: QueryDocumentsProps<
      DocTypeNames,
      Query,
      QueryResult
    >,
  ): Promise<QueryDocumentsResult<QueryResult>> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const rawResultData = await this.safeDocStore.query(
      props.docTypeName,
      props.query,
      docType.docStoreParams,
    );

    const data = coerceQueryResult(
      props.docTypeName,
      props.coerceResult,
      rawResultData.data,
    );

    return { data };
  }

  /**
   * Replaces a document.
   * This function will not attempt to set the common fields (e.g. docOpIds or docLastUpdatedByUserId)
   * or raise change events. This is intended for migrations where explicit control over the contents of
   * the written file is required.
   * @param props A property bag.
   */
  async replaceDocument<Doc extends DocBase>(
    props: ReplaceDocumentProps<DocTypeNames, Doc>,
  ): Promise<ReplaceDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    ensureCanReplaceDocuments(docType);

    const doc = props.doc as Doc;

    applyCommonFieldValuesToDoc(
      doc,
      this.getMillisecondsSinceEpoch(),
      props.userId,
      this.getNewDocVersion(),
    );
    executeValidateDoc(
      props.docTypeName,
      docType.validateFields,
      docType.validateDoc,
      doc,
    );
    ensureDocSystemFields(props.docTypeName, doc);

    const upsertResult = await this.safeDocStore.upsert(
      props.docTypeName,
      partition,
      doc as unknown as DocStoreRecord,
      null,
      docType.docStoreParams,
    );

    const isNew = upsertResult.code === DocStoreUpsertResultCode.CREATED;

    return {
      isNew,
      doc,
    };
  }

  /**
   * Selects a set of documents using a filter.
   * @param props A property bag.
   */
  async selectDocumentsByFilter<Doc extends DocBase>(
    props: SelectDocumentsByFilterProps<
      DocTypeNames,
      Filter
    >,
  ): Promise<SelectDocumentsByFilterResult<Doc>> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    const selectResult = await this.safeDocStore.selectByFilter(
      props.docTypeName,
      partition,
      props.filter,
      props.includeArchived,
      docType.docStoreParams,
    );

    return { docs: selectResult.docs as unknown as Doc[] };
  }

  /**
   * Selects a set of documents using an array of document ids.
   * Duplicate ids will be filtered out.
   * If a value is specified for cacheSeconds then the cache
   * will be checked for existing values.
   * @param props A property bag.
   */
  async selectDocumentsByIds<Doc extends DocBase>(
    props: SelectDocumentsByIdsProps<DocTypeNames>,
  ): Promise<SelectDocumentsByIdsResult<Doc>> {
    const uniqueIds = [...new Set(props.ids)];

    const docs: Doc[] = [];
    const docIdsToFetch: string[] = [];

    // Attempt to pull values from the cache.
    if (typeof props.cacheMilliseconds === "number") {
      for (const id of uniqueIds) {
        const cachedDoc = this.cache.get(id);

        if (typeof cachedDoc === "undefined") {
          docIdsToFetch.push(id);
        } else {
          docs.push(cachedDoc as Doc);
        }
      }
    } else {
      docIdsToFetch.push(...props.ids);
    }

    if (docIdsToFetch.length > 0) {
      const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

      const partition = ensurePartition(
        props.partition,
        this.centralPartitionName,
        docType.useSinglePartition,
      );

      const selectResult = await this.safeDocStore.selectByIds(
        props.docTypeName,
        partition,
        docIdsToFetch,
        docType.docStoreParams,
      );

      for (const storedRecord of selectResult.docs) {
        const doc = storedRecord as unknown as Doc;

        docs.push(doc);

        if (typeof props.cacheMilliseconds === "number") {
          this.cache.set(doc.id, doc, props.cacheMilliseconds);
        }
      }
    }

    return {
      docs,
    };
  }

  /**
   * Selects all documents of a specified doc type.
   * @param props A property bag.
   */
  async selectDocuments<Doc extends DocBase>(
    props: SelectDocumentsProps<DocTypeNames>,
  ): Promise<SelectDocumentsResult<Doc>> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const partition = ensurePartition(
      props.partition,
      this.centralPartitionName,
      docType.useSinglePartition,
    );

    ensureCanFetchWholeCollection(docType);

    const selectResult = await this.safeDocStore.selectAll(
      props.docTypeName,
      partition,
      props.includeArchived,
      docType.docStoreParams,
    );

    return { docs: selectResult.docs as unknown as Doc[] };
  }

  /**
   * Selects a document of a specified doc type by id.  If
   * the document is not found then null is returned.
   * @param props A property bag.
   */
  async selectDocumentById<Doc extends DocBase>(
    props: SelectDocumentByIdProps<DocTypeNames>,
  ): Promise<SelectDocumentByIdResult<Doc>> {
    const result = await this.selectDocumentsByIds({
      docTypeName: props.docTypeName,
      ids: [props.id],
      partition: props.partition,
      includeArchived: true,
      cacheMilliseconds: props.cacheMilliseconds,
    });

    return {
      doc: result.docs.length === 1 ? result.docs[0] as Doc : null,
    };
  }

  /**
   * Retrieves a document of a specified doc type by id.  If
   * the document is not found then an error is raised.
   * @param props A property bag.
   */
  async getDocumentById<Doc extends DocBase>(
    props: GetDocumentByIdProps<DocTypeNames>,
  ): Promise<GetDocumentByIdResult<Doc>> {
    const result = await this.selectDocumentsByIds({
      docTypeName: props.docTypeName,
      ids: [props.id],
      partition: props.partition,
      includeArchived: true,
      cacheMilliseconds: props.cacheMilliseconds,
    });

    if (result.docs.length !== 1) {
      throw new SengiDocNotFoundError(
        props.docTypeName,
        props.id,
      );
    }

    return {
      doc: result.docs[0] as Doc,
    };
  }

  /**
   * Returns a DocumentChangedProps object which describes an event, or
   * null if no event should be raised.  If the event data has been built
   * previously then the event data is loaded from the events container,
   * otherwise it is constructed, written to the events container and returned.
   * @param action The action that triggered this event.
   * @param raiseChangeEventPartition The partition for the event.  This should
   * typically be left undefined and the docPartition will be used instead.
   * @param changeEventFieldNames The names of the fields that should be included
   * in the event data.
   * @param docTypeName The type of document that was mutated, triggered the event.
   * @param docPartition The partition used for the document that was mutated.  If
   * raiseChangeEventPartition is not specified then this partition will be used.
   * @param doc The unmodified document that triggered the event.
   * @param digest The digest associated with the mutation.
   * @param userId The id of the user that triggered the event.
   */
  private async buildChangeEvent(
    action: DocMutationType,
    raiseChangeEventPartition: undefined | string,
    changeEventFieldNames: string[],
    docTypeName: string,
    docPartition: string,
    doc: DocStoreRecord | null, // Not available when re-deleting a document.
    patch: DocStoreRecord | null, // Only supplied for patch.
    digest: string,
    userId: string,
  ): Promise<DocumentChangedEventProps | null> {
    const changeEventDocPartition = raiseChangeEventPartition || docPartition;

    ensureRaiseChangeEventsConfig(
      this.documentChanged,
      this.changeEventDocTypeName,
      this.changeEventDocStoreParams,
    );

    const existingChangeEvent = await this.safeDocStore.fetch(
      this.changeEventDocTypeName,
      changeEventDocPartition,
      digest,
      this.changeEventDocStoreParams!,
    );

    if (existingChangeEvent.doc) {
      return {
        digest: existingChangeEvent.doc.id as string,
        action: existingChangeEvent.doc.action as string,
        subjectId: existingChangeEvent.doc.subjectId as string,
        subjectDocType: existingChangeEvent.doc.subjectDocType as string,
        subjectFields: existingChangeEvent.doc.subjectFields as Record<
          string,
          unknown
        >,
        subjectPatchFields: existingChangeEvent.doc
          .subjectPatchFields as Record<
            string,
            unknown
          >,
        timestampInMilliseconds: existingChangeEvent.doc.timestamp as number,
        changeUserId: existingChangeEvent.doc.changeUserId as string,
      };
    } else if (doc) {
      const changeEvent: DocumentChangedEventProps = {
        digest,
        action,
        subjectId: doc.id as string,
        subjectDocType: docTypeName,
        subjectFields: buildChangedFieldBlock(doc, changeEventFieldNames),
        subjectPatchFields: patch
          ? buildChangedFieldBlock(patch, changeEventFieldNames)
          : {},
        timestampInMilliseconds: this.getMillisecondsSinceEpoch(),
        changeUserId: userId,
      };

      const changeEventDoc = {
        id: digest,
        docType: this.changeEventDocTypeName,
        ...changeEvent,
      };

      applyCommonFieldValuesToDoc(
        changeEventDoc,
        this.getMillisecondsSinceEpoch(),
        userId,
        this.getNewDocVersion(),
      );

      await this.safeDocStore.upsert(
        this.changeEventDocTypeName,
        changeEventDocPartition,
        changeEventDoc,
        null,
        this.changeEventDocStoreParams!,
      );

      return changeEvent;
    } else {
      // This would suggest a doc was not supplied and an existing
      // event was not found.  This can happen if an attempt is made
      // to delete a document which is no longer present.
      return null;
    }
  }
}
