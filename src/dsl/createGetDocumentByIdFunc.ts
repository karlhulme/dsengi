import { capitalizeFirstLetter, TypescriptTreeFunction } from "../../deps.ts";

/**
 * Returns a getDocumentById function definition.
 * @param system The name of the Jsonotron system to which
 * the type belongs.  This is typically 'db'.
 * @param name The name of the document collection.
 * @param useSinglePartition True if the documents are stored
 * in a single partition, or false if a partition will need
 * to be supplied when using this document collection.
 */
export function createGetDocumentByIdFunc(
  system: string,
  name: string,
  useSinglePartition: boolean,
): TypescriptTreeFunction {
  return {
    name: `get${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(name)
    }ById`,
    params: [{
      name: "props",
      typeName: `{ id: string, cacheMilliseconds?: number, ${
        useSinglePartition ? "" : "partition: string,"
      }}`,
    }],
    outputGeneration: 2,
    exported: true,
    lines: `return sengi.getDocumentById<${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(name)
    }>({
        docTypeName: '${name}',
        id: props.id,
        cacheMilliseconds: props.cacheMilliseconds,
        ${
      useSinglePartition ? "partition: null," : "partition: props.partition,"
    }})`,
  };
}
