/**
 * Returns the partition name to use.
 * If a single partition is being used (last param) then it will be considered
 * an error to pass the name of a chosen partition, otherwise a non-null
 * partition name is required.
 * @param partition A partition.
 * @param centralPartitionName The name of the central partition.
 * @param useSinglePartition True if a document type uses a single partition.
 */
export function ensurePartition(
  partition: string | null,
  centralPartitionName: string,
  useSinglePartition?: boolean,
) {
  if (useSinglePartition) {
    if (partition === null) {
      return centralPartitionName;
    } else {
      throw new Error(
        "Document type uses a single partition so you must specify null as the partition value.",
      );
    }
  } else {
    if (partition) {
      return partition;
    } else {
      throw new Error(
        `Document type uses multiple partitions so a partition value must be specified.`,
      );
    }
  }
}
