import { TypescriptTreeFunction } from "../../deps.ts";
import { capitalizeFirstLetter } from "./capitalizeFirstLetter.ts";

/**
 * Returns an selectDocuments function definition.
 * @param system The name of the Jsonotron system to which
 * the type belongs.  This is typically 'db'.
 * @param name The name of the document collection.
 * @param pluralName the plural name of the document collection.
 * @param useSinglePartition True if the documents are stored
 * in a single partition, or false if a partition will need
 * to be supplied when using this document collection.
 */
export function createSelectDocumentsFunc(
  system: string,
  name: string,
  pluralName: string,
  useSinglePartition: boolean,
): TypescriptTreeFunction {
  return {
    name: `select${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(pluralName)
    }`,
    params: [{
      name: "props",
      typeName: `{ ${
        useSinglePartition ? "" : "partition: string,"
      } statuses?: 'all'|'active'|'archived' }`,
    }],
    outputGeneration: 2,
    exported: true,
    lines: `return sengi.selectDocuments<${capitalizeFirstLetter(system)}${
      capitalizeFirstLetter(name)
    }>({
        docTypeName: '${name}',
        ${
      useSinglePartition ? "partition: null," : "partition: props.partition,"
    }
        statuses: props.statuses
      })`,
  };
}
