import { TypescriptTreeFunction } from "../../deps.ts";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.ts";

/**
 * Returns a selectDocumentsByIds function definition.
 * @param system The name of the Jsonotron system to which
 * the type belongs.  This is typically 'db'.
 * @param name The name of the document collection.
 * @param pluralName The plural name of the document collection.
 * @param useSinglePartition True if the documents are stored
 * in a single partition, or false if a partition will need
 * to be supplied when using this document collection.
 */
export function createSelectDocumentsByIdsFunc(
  system: string,
  name: string,
  pluralName: string,
  useSinglePartition: boolean,
): TypescriptTreeFunction {
  return {
    name: `select${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(pluralName)
    }ByIds`,
    params: [{
      name: "props",
      typeName: `{ ids: string[], cacheMilliseconds?: number, ${
        useSinglePartition ? "" : "partition: string,"
      }}`,
    }],
    outputGeneration: 2,
    exported: true,
    lines: `return sengi.selectDocumentsByIds<${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(name)
    }>({
        docTypeName: '${name}',
        ids: props.ids,
        cacheMilliseconds: props.cacheMilliseconds,
        ${
      useSinglePartition ? "partition: null," : "partition: props.partition,"
    }})`,
  };
}
