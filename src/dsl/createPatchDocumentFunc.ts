import { capitalizeFirstLetter, TypescriptTreeFunction } from "../../deps.ts";

/**
 * Returns an patchDocument function definition.
 * @param system The name of the Jsonotron system to which
 * the type belongs.  This is typically 'db'.
 * @param name The name of the document collection.
 * @param useSinglePartition True if the documents are stored
 * in a single partition, or false if a partition will need
 * to be supplied when using this document collection.
 */
export function createPatchDocumentFunc(
  system: string,
  name: string,
  useSinglePartition: boolean,
): TypescriptTreeFunction {
  return {
    name: `patch${capitalizeFirstLetter(system)}${capitalizeFirstLetter(name)}`,
    params: [{
      name: "props",
      typeName: `{ id: string, patch: PartialNullable<Omit<${
        capitalizeFirstLetter(system)
      }${
        capitalizeFirstLetter(name)
      }, OmittedPatchDocumentFieldNames>>, operationId?: string|null, userId?: string|null, reqVersion?: string, sequenceNo?: string, ${
        useSinglePartition ? "" : "partition: string,"
      }}`,
    }],
    outputGeneration: 2,
    exported: true,
    lines: `return sengi.patchDocument<${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(name)
    }>({
        docTypeName: '${name}',
        id: props.id,
        patch: props.patch,
        operationId: props.operationId || crypto.randomUUID(),
        userId: props.userId || SYSTEM_USER_ID,
        reqVersion: props.reqVersion,
        sequenceNo: props.sequenceNo,
        ${
      useSinglePartition ? "partition: null," : "partition: props.partition,"
    }
      })`,
  };
}
