import {
  EnumTypeDef,
  generateTypescript,
  newTypescriptTree,
  RecordTypeDef,
} from "../../deps.ts";
import { appendJsonotronTypesToTree, stdSystemTypes } from "../../deps.ts";
import { DslCollection } from "./DslCollection.ts";
import { DslDb } from "./DslDb.ts";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.ts";
import { createArchiveDocumentFunc } from "./createArchiveDocumentFunc.ts";
import { createDeleteDocumentFunc } from "./createDeleteDocumentFunc.ts";
import { createGetDocumentByIdFunc } from "./createGetDocumentByIdFunc.ts";
import { createNewDocumentFunc } from "./createNewDocumentFunc.ts";
import { createPatchDocumentFunc } from "./createPatchDocumentFunc.ts";
import { createQueryDocumentsFunc } from "./createQueryDocumentsFunc.ts";
import { createRedactDocumentFunc } from "./createRedactDocumentFunc.ts";
import { createReplaceDocumentFunc } from "./createReplaceDocumentFunc.ts";
import { createSelectDocumentByIdFunc } from "./createSelectDocumentById.ts";
import { createSelectDocumentsByFilterFunc } from "./createSelectDocumentsByFilterFunc.ts";
import { createSelectDocumentsByIdsFunc } from "./createSelectDocumentsByIdsFunc.ts";
import { createSelectDocumentsFunc } from "./createSelectDocumentsFunc.ts";
import { createSengiStandardProperties } from "./createSengiStandardProperties.ts";

/**
 * Generates a series of strongly typed functions for
 * interacting with a Mongo database based on a set of
 * document collection definitions.  The definitions must
 * adhere to the schema defined at
 * https://raw.githubusercontent.com/karlhulme/djsonotron/main/schemas/sengi.json
 * and will typically be loaded from JSON files in a db
 * folder in the root of a service repository.
 * @param resources An array of resource files.
 */
// deno-lint-ignore no-explicit-any
export function generateCodeForMongoDatabase(resources: any[]) {
  const db: DslDb = resources.find((r) =>
    r.$schema ===
      "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/db.json"
  );

  if (!db) {
    throw new Error("A db resource was not found.");
  }

  const colls: DslCollection[] = resources.filter((r) =>
    r.$schema ===
      "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/collection.json"
  );

  if (colls.length === 0) {
    throw new Error("No collection resources were found.");
  }

  // Create the typescript tree for all the types and functions
  // that we're going to define.
  const tree = newTypescriptTree();

  // Add the imports that are expected to be in the deps file.
  tree.imports.push(
    ...[
      "MongoDbDocStore",
      "MongoDbDocStoreFilter",
      "MongoDbDocStoreParams",
      "MongoDbDocStoreQuery",
      "generateIdWithPrefix",
      "Sengi",
    ].map((impt) => ({ name: impt, path: db.depsPath })),
  );

  // Add the Sengi constants
  tree.constDeclarations.push({
    name: "SYSTEM_USER_ID",
    value: db.systemUserId ? `"${db.systemUserId}"` : `"user_system"`,
    exported: true,
  });

  // Add the Mongo constants
  tree.constDeclarations.push({
    name: `${db.appName}ConnectionString`,
    value:
      `Deno.env.get("${db.appName.toUpperCase()}_MONGO_URL") || "<BLANK_MONGO_URL>"`,
  });
  tree.constDeclarations.push({
    name: `${db.appName}MongoStrict`,
    value: `Boolean(Deno.env.get("${db.appName.toUpperCase()}_MONGO_STRICT"))`,
  });
  tree.constDeclarations.push({
    name: `${db.appName}MongoDbName`,
    value:
      `Deno.env.get("${db.appName.toUpperCase()}_MONGO_DB") || "<BLANK_MONGO_DB>`,
  });
  tree.constDeclarations.push({
    name: `${db.appName}MongoPerfLogging`,
    value:
      `Boolean(Deno.env.get("${db.appName.toUpperCase()}_MONGO_PERF_LOG"))`,
  });

  // Add the type definitions needed for the functions for
  // creating, patching and replacing documents.
  tree.types.push({
    name: "PartialNullable<T>",
    def: "{ [K in keyof T]?: T[K] | null };",
  });
  tree.types.push({
    name: "OmittedNewDocumentFieldNames",
    def: `"id"
      | "docType"
      | "docStatus"
      | "docVersion"
      | "docOpIds"
      | "docDigests"
      | "docCreatedByUserId"
      | "docCreatedMillisecondsSinceEpoch"
      | "docLastUpdatedByUserId"
      | "docLastUpdatedMillisecondsSinceEpoch"
      | "docArchivedByUserId"
      | "docArchivedMillisecondsSinceEpoch"
      | "docRedactedByUserId"
      | "docRedactedMillisecondsSinceEpoch";`,
  });
  tree.types.push({
    name: "OmittedPatchDocumentFieldNames",
    def: `"id"
      | "docType"
      | "docStatus"
      | "docVersion"
      | "docOpIds"
      | "docDigests"
      | "docCreatedByUserId"
      | "docCreatedMillisecondsSinceEpoch"
      | "docLastUpdatedByUserId"
      | "docLastUpdatedMillisecondsSinceEpoch"
      | "docArchivedByUserId"
      | "docArchivedMillisecondsSinceEpoch"
      | "docRedactedByUserId"
      | "docRedactedMillisecondsSinceEpoch";`,
  });
  tree.types.push({
    name: "OmittedReplaceDocumentFieldNames",
    def: `"docVersion"
      | "docOpIds"
      | "docDigests"
      | "docCreatedByUserId"
      | "docCreatedMillisecondsSinceEpoch"
      | "docLastUpdatedByUserId"
      | "docLastUpdatedMillisecondsSinceEpoch"
      | "docArchivedByUserId"
      | "docArchivedMillisecondsSinceEpoch"
      | "docRedactedByUserId"
      | "docRedactedMillisecondsSinceEpoch";`,
  });

  // Create a list of types and seed it with the standard types.
  const types = [...stdSystemTypes];

  // Create an array of sengi doc types that can be serialized
  // into the constructor that we output at the end.
  const sengiDocTypes = [];

  // Loop over all the JSON files in the directory.
  for (const coll of colls) {
    try {
      // Create a doc type definition.
      sengiDocTypes.push(`{
        name: "${coll.name}",
        docStoreParams: {
          databaseName: ${db.appName}MongoDbName,
          collectionName: "${db.svcName}_${coll.pluralName}",
        },
        useSinglePartition: ${coll.useSinglePartition ? "true" : "false"},
        validateFields: validateErrorsToString(validate${
        capitalizeFirstLetter(coll.system)
      }${capitalizeFirstLetter(coll.name)}),
        validateDoc: () => {},
        newId: () => generateIdWithPrefix("${coll.idPrefix}"),
        storePatches: ${coll.storePatches ? "true" : "false"},
        trackChanges: ${coll.trackChanges ? "true" : "false"},
        changeFieldNames: ${JSON.stringify(coll.changeFieldNames)},
        redactFields: ${JSON.stringify(coll.redactFields)},
        policy: ${JSON.stringify(coll.policy || {})}
      }`);

      // Create a record definition from the top-level sengi definition.
      types.push({
        system: coll.system,
        kind: "record",
        name: coll.name,
        pluralName: coll.pluralName,
        summary: coll.summary,
        labels: coll.labels,
        tags: coll.tags,
        properties: [
          ...createSengiStandardProperties(coll.name),
          ...coll.properties,
        ],
        deprecated: coll.deprecated,
      } as RecordTypeDef<string>);

      // Create an enum definition from any child enums defined in this sengi file.
      if (coll.types?.enums && Array.isArray(coll.types?.enums)) {
        for (const sengiEnum of coll.types.enums) {
          types.push({
            system: coll.system,
            kind: "enum",
            name: sengiEnum.name,
            pluralName: sengiEnum.pluralName,
            summary: sengiEnum.summary,
            deprecated: coll.deprecated,
            items: sengiEnum.items,
          } as EnumTypeDef);
        }
      }

      // Create a record definition from any child records defined in this sengi file.
      if (coll.types?.records && Array.isArray(coll.types.records)) {
        for (const sengiRecord of coll.types.records) {
          types.push({
            system: coll.system,
            kind: "record",
            name: sengiRecord.name,
            pluralName: sengiRecord.pluralName,
            summary: sengiRecord.summary,
            deprecated: coll.deprecated,
            properties: sengiRecord.properties,
          } as RecordTypeDef<string>);
        }
      }

      // Add the typed methods for this sengi file.
      tree.functions.push(createArchiveDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createDeleteDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createGetDocumentByIdFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createNewDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createPatchDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createQueryDocumentsFunc(
        coll.system,
        coll.name,
        coll.pluralName,
        "MongoDbDocStoreQuery",
      ));
      tree.functions.push(createRedactDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createReplaceDocumentFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createSelectDocumentByIdFunc(
        coll.system,
        coll.name,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createSelectDocumentsFunc(
        coll.system,
        coll.name,
        coll.pluralName,
        Boolean(coll.useSinglePartition),
      ));
      tree.functions.push(createSelectDocumentsByFilterFunc(
        coll.system,
        coll.name,
        coll.pluralName,
        Boolean(coll.useSinglePartition),
        "MongoDbDocStoreFilter",
      ));
      tree.functions.push(createSelectDocumentsByIdsFunc(
        coll.system,
        coll.name,
        coll.pluralName,
        Boolean(coll.useSinglePartition),
      ));
    } catch (err) {
      throw new Error(
        `Unable to create functions for definition.\n${err}\n${
          JSON.stringify(coll)
        }`,
      );
    }
  }

  // Append all the type definitions to the tree.
  appendJsonotronTypesToTree(tree, types, "#/components/schemas/");

  // Declare the doc store instance based on Mongo.
  tree.constDeclarations.push({
    name: "docStore",
    outputGeneration: 1,
    value: `new MongoDbDocStore({
      connectionString: ${db.appName}ConnectionString,
      strict: ${db.appName}MongoStrict,
      generateDocVersionFunc: () => {
        const len = 16
        const buf = new Uint8Array(len / 2);
        crypto.getRandomValues(buf);
        let ret = "";
        for (let i = 0; i < buf.length; ++i) {
          ret += ("0" + buf[i].toString(16)).slice(-2);
        }
        return ret;
      }
    })`,
  });

  // Add a close function for the Mongo doc store.
  tree.functions.push({
    name: "closeMongoConnection",
    params: [],
    exported: true,
    comment: "Close the connection to the Mongo database.",
    outputGeneration: 2,
    lines: "return docStore.close();",
  });

  // Declare the sengi instance based on Mongo.
  tree.constDeclarations.push({
    name: "sengi",
    outputGeneration: 1,
    value: `new Sengi<
      DbTypeNames,
      MongoDbDocStoreParams,
      MongoDbDocStoreFilter,
      MongoDbDocStoreQuery
    >({
      docStore,
      docTypes: [${sengiDocTypes.join(", ")}],
      patchDocStoreParams: {
        databaseName: ${db.appName}MongoDbName,
        collectionName: "${db.svcName}_patches",
      },
      patchSelectionFilter: (_partition, documentId, from, limit) => ({
        limit,
        orderByFields: [{
          fieldName: "id",
          direction: "descending",
        }],
        whereClause: {
          $and: [
            { patchedDocId: documentId },
            { id: { $gt: from || "" } },
          ],
        },
      }),
      patchNewId: () => generateIdWithPrefix("patch"),
      changeDocStoreParams: {
        databaseName: ${db.appName}MongoDbName,
        collectionName: "${db.svcName}_changes",
      },
      validateUserId: validateErrorsToString(validateStdIdWithPrefix),
      logPerformance: ${db.appName}MongoPerfLogging
    });`,
  });

  // Add a function for retrieving document patches.
  tree.functions.push({
    name: "selectPatches",
    params: [{
      name: "props",
      typeName:
        "{ partition: string, documentId: string, from?: string, limit?: number }",
    }],
    exported: true,
    comment: "Retrieve the patches for a document.",
    outputGeneration: 2,
    lines: `return sengi.selectPatches({
      partition: props.partition,
      documentId: props.documentId,
      from: props.from,
      limit: props.limit
    });`,
  });

  // Convert the Typescript tree to code.
  return generateTypescript(tree);
}
