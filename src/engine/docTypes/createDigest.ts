/**
 * The type of document mutation.
 */
export type DocMutationType = "create" | "patch" | "archive";

/**
 * Returns a digest that represents the mutation described
 * by the given parameters.
 * @param operationId The id of the operation.
 * @param mutationType The type of mutation.
 * @param mutationParams The parameters for the mutation.
 * @param sequenceNo The sequence of the mutation which should be specified
 * if multiple mutations are required using identical mutation params, such
 * as when creating a set of identical documents.
 */
export async function createDigest(
  operationId: string,
  mutationType: DocMutationType,
  mutationParams?: unknown,
  sequenceNo?: string,
) {
  const seq = sequenceNo || "0";

  const paramStrings = JSON.stringify(mutationParams || null);
  const subject = operationId + seq + mutationType + paramStrings;

  const encoder = new TextEncoder();
  const data = encoder.encode(subject);

  const hashBuffer = await crypto.subtle.digest("SHA-1", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const opLast4Chars = operationId.slice(-4);
  const mutChar = convertMutationTypeToLetter(mutationType);

  return `${opLast4Chars}:${mutChar}${seq}:${hashHex}`;
}

/**
 * Returns a single character representing the type of mutation.
 * @param mutationType A type of mutation.
 */
function convertMutationTypeToLetter(mutationType: DocMutationType) {
  switch (mutationType) {
    case "archive":
      return "A";
    case "create":
      return "C";
    default:
    case "patch":
      return "P";
  }
}
