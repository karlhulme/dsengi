import { TtlCache } from "../../../deps.ts";
import {
  ArchiveDocumentProps,
  ArchiveDocumentResult,
  DeleteDocumentProps,
  DeleteDocumentResult,
  DocBase,
  DocStatuses,
  DocStore,
  DocStoreDeleteByIdResultCode,
  DocStoreRecord,
  DocStoreUpsertResultCode,
  DocType,
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
import {
  appendDocOpId,
  applyCommonFieldValuesToDoc,
  coerceQueryResult,
  ensureCanDeleteDocuments,
  ensureCanFetchWholeCollection,
  ensureCanReplaceDocuments,
  ensureDocId,
  ensureDocSystemFields,
  ensureDocWasFound,
  ensureUserId,
  executePatch,
  executeValidateDoc,
  isOpIdInDocument,
  selectDocTypeFromArray,
} from "../docTypes/index.ts";

/**
 * The default number of documents to cache that have been retrieved by id.
 */
const DEFAULT_CACHE_SIZE = 500;

/**
 * The default name of a doc type that stores a patch.
 */
const DEFAULT_PATCH_DOC_TYPE_NAME = "patch";

/**
 * The properties that are used to manage the construction of a Sengi.
 */
export interface SengiConstructorProps<
  DocStoreParams,
  Filter,
  Query,
> {
  /**
   * The document store that provides long-term storage for the sengi engine.
   */
  docStore?: DocStore<DocStoreParams, Filter, Query>;

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
  docTypes?: DocType[];

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
}

/**
 * A sengi engine for processing selection, querying and upsertion of docs
 * to a No-SQL, document based database or backing store.
 */
export class Sengi<
  DocStoreParams,
  Filter,
  Query,
> {
  private docTypes: DocType[];
  private safeDocStore: SafeDocStore<
    DocStoreParams,
    Filter,
    Query
  >;
  private validateUserId: (userId: string) => string | void;
  private getMillisecondsSinceEpoch: () => number;
  private getNewDocVersion: () => string;
  private cache: TtlCache<DocBase>;
  private patchDocTypeName: string;
  private patchDocStoreParams: DocStoreParams;

  /**
   * Creates a new Sengi engine based on a set of doc types and clients.
   * @param props The constructor properties.
   */
  constructor(
    props: SengiConstructorProps<
      DocStoreParams,
      Filter,
      Query
    > = {},
  ) {
    this.docTypes = props.docTypes || [];
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

    if (!props.patchDocStoreParams) {
      throw new Error("Must supply doc store params for the patch documents.");
    }

    this.patchDocStoreParams = props.patchDocStoreParams;
  }

  /**
   * Archives an existing document.
   * @param props A property bag.
   */
  async archiveDocument<Doc extends DocBase>(
    props: ArchiveDocumentProps<DocStoreParams>,
  ): Promise<ArchiveDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const fetchResult = await this.safeDocStore.fetch(
      props.docTypeName,
      props.partition,
      props.id,
      props.docStoreParams,
    );

    const doc = ensureDocWasFound(
      props.docTypeName,
      props.id,
      fetchResult.doc as unknown as Partial<DocBase>,
    );

    const loadedDocVersion = doc.docVersion as string;

    const isAlreadyArchived = doc.docStatus === DocStatuses.Archived &&
      Boolean(doc.docArchivedByUserId) &&
      Boolean(doc.docArchivedMillisecondsSinceEpoch);

    if (!isAlreadyArchived) {
      applyCommonFieldValuesToDoc(
        doc,
        this.getMillisecondsSinceEpoch(),
        props.userId,
        this.getNewDocVersion(),
      );

      doc.docStatus = DocStatuses.Archived;
      doc.docArchivedByUserId = props.userId;
      doc.docArchivedMillisecondsSinceEpoch = this.getMillisecondsSinceEpoch();

      const result = await this.safeDocStore.upsert(
        props.docTypeName,
        props.partition,
        doc as unknown as DocStoreRecord,
        loadedDocVersion,
        props.docStoreParams,
      );

      ensureUpsertSuccessful(result, false);
    }

    return {
      isArchived: !isAlreadyArchived,
      doc: doc as Doc,
    };
  }

  /**
   * Deletes an existing document.
   * If the document does not exist then the call succeeds but indicates that a document was not actually deleted.
   * @param props A property bag.
   */
  async deleteDocument(
    props: DeleteDocumentProps<DocStoreParams>,
  ): Promise<DeleteDocumentResult> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    ensureCanDeleteDocuments(docType);

    const deleteByIdResult = await this.safeDocStore.deleteById(
      props.docTypeName,
      props.partition,
      props.id,
      props.docStoreParams,
    );

    const isDeleted =
      deleteByIdResult.code === DocStoreDeleteByIdResultCode.DELETED;

    return { isDeleted };
  }

  /**
   * Adds a new document to a collection by supplying all the data.
   * @param props A property bag.
   */
  async newDocument<Doc extends DocBase>(
    props: NewDocumentProps<Doc, DocStoreParams>,
  ): Promise<NewDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    ensureDocId(props.doc);

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const fetchResult = await this.safeDocStore.fetch(
      docType.name,
      props.partition,
      props.doc.id as string,
      props.docStoreParams,
    );

    if (fetchResult.doc) {
      return {
        isNew: false,
        doc: fetchResult.doc as unknown as Doc,
      };
    } else {
      const doc = props.doc as Partial<Doc>;

      doc.docType = props.docTypeName;
      doc.docStatus = DocStatuses.Active;
      doc.docOpIds = [];
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

      await this.safeDocStore.upsert(
        props.docTypeName,
        props.partition,
        doc as unknown as DocStoreRecord,
        null,
        props.docStoreParams,
      );

      return {
        isNew: true,
        doc: doc as Doc,
      };
    }
  }

  /**
   * Patches an existing document with a merge patch.
   * Although very unlikely, it's possible that a patch is successfully
   * applied but an error is encountered when trying to write the patch
   * to te patches container.  If this circumstance it is safe to try
   * applying the patch again.
   * @param props A property bag.
   */
  async patchDocument<Doc extends DocBase>(
    props: PatchDocumentProps<Doc, DocStoreParams>,
  ): Promise<PatchDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

    const fetchResult = await this.safeDocStore.fetch(
      props.docTypeName,
      props.partition,
      props.id,
      props.docStoreParams,
    );

    const doc = ensureDocWasFound(
      props.docTypeName,
      props.id,
      fetchResult.doc as unknown as Partial<Doc>,
    );

    const loadedDocVersion = doc.docVersion as string;

    const opIdAlreadyExists = isOpIdInDocument(doc, props.operationId);

    if (!opIdAlreadyExists) {
      executePatch(
        props.docTypeName,
        docType.readOnlyFieldNames,
        doc as Doc,
        props.patch,
      );
      appendDocOpId(docType, doc, props.operationId);

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

      const upsertResult = await this.safeDocStore.upsert(
        props.docTypeName,
        props.partition,
        doc as unknown as DocStoreRecord,
        props.reqVersion || loadedDocVersion,
        props.docStoreParams,
      );

      ensureUpsertSuccessful(upsertResult, Boolean(props.reqVersion));
    }

    if (props.storePatch) {
      const patchDoc = {
        id: props.operationId,
        docType: this.patchDocTypeName,
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
        this.patchDocTypeName,
        props.partition,
        patchDoc,
        null,
        this.patchDocStoreParams,
      );
    }

    return {
      isUpdated: !opIdAlreadyExists,
      doc: doc as Doc,
    };
  }

  /**
   * Executes a query across a set of documents.
   * @param props A property bag.
   */
  async queryDocuments<QueryResult>(
    props: QueryDocumentsProps<Query, QueryResult, DocStoreParams>,
  ): Promise<QueryDocumentsResult<QueryResult>> {
    const rawResultData = await this.safeDocStore.query(
      props.docTypeName,
      props.query,
      props.docStoreParams,
    );

    const data = coerceQueryResult(
      props.docTypeName,
      props.coerceResult,
      rawResultData.data,
    );

    return { data };
  }

  /**
   * Replaces (or inserts) a document.
   * Unlike the newDocument function, this function will replace an existing document.
   * It will not attempt to set the common fields (e.g. docOpIds or docLastUpdatedByUserId).
   * @param props A property bag.
   */
  async replaceDocument<Doc extends DocBase>(
    props: ReplaceDocumentProps<Doc, DocStoreParams>,
  ): Promise<ReplaceDocumentResult<Doc>> {
    ensureUserId(
      props.userId,
      this.validateUserId,
    );

    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);

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
      props.partition,
      doc as unknown as DocStoreRecord,
      null,
      props.docStoreParams,
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
      Filter,
      DocStoreParams
    >,
  ): Promise<SelectDocumentsByFilterResult<Doc>> {
    const selectResult = await this.safeDocStore.selectByFilter(
      props.docTypeName,
      props.partition,
      props.filter,
      props.includeArchived,
      props.docStoreParams,
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
    props: SelectDocumentsByIdsProps<DocStoreParams>,
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
      const selectResult = await this.safeDocStore.selectByIds(
        props.docTypeName,
        props.partition,
        docIdsToFetch,
        props.docStoreParams,
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
    props: SelectDocumentsProps<DocStoreParams>,
  ): Promise<SelectDocumentsResult<Doc>> {
    const docType = selectDocTypeFromArray(this.docTypes, props.docTypeName);
    ensureCanFetchWholeCollection(docType);

    const selectResult = await this.safeDocStore.selectAll(
      props.docTypeName,
      props.partition,
      props.includeArchived,
      props.docStoreParams,
    );

    return { docs: selectResult.docs as unknown as Doc[] };
  }

  /**
   * Selects a document of a specified doc type by id.  If
   * the document is not found then null is returned.
   * @param props A property bag.
   */
  async selectDocumentById<Doc extends DocBase>(
    props: SelectDocumentByIdProps<DocStoreParams>,
  ): Promise<SelectDocumentByIdResult<Doc>> {
    const result = await this.selectDocumentsByIds({
      docStoreParams: props.docStoreParams,
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
    props: GetDocumentByIdProps<DocStoreParams>,
  ): Promise<GetDocumentByIdResult<Doc>> {
    const result = await this.selectDocumentsByIds({
      docStoreParams: props.docStoreParams,
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
}
