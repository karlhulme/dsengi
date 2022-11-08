# DSengi

A utility for retrieving, storing and mutating documents stored in a NoSQL
database such as Azure Cosmos DB.

You can use Jsonotron to generate interfaces for each document type to be saved.

## Todo

- Write tests for the `/src/cosmosClient` namespace / separate out.

## Design

A NoSQL database offers a few specific benefits:

- Schemaless backend allows schema to be made defined solely within in the
  design layer, which simplifies environment setup and upgrade.
- Data is stored in partitions and thus scales horizontally with performance
  maintained.
- None of the mutations require locks so performance is maintained.
- It can be globally distributed, storing data nearer customers.

However there are a number of specific lost benefits:

- Loss of transaction support.
- Loss of aggregation, for example, determining the top 5 records for a given
  ordering requires that all the individual physical containers be queried first
  and then the resultant top 5 determined afterwards.

### Transactions

When working with NoSQL databases, ACID support is not usually available. In
fact, it may not be possible to implement ACID support on a distributed
schemaless database while maintaining predicatable and controllable performance
levels. Other mitigations must be adopted:

- A - Atomic (must be aware that data is eventually consistency when reading.)
- C - Consistency (data validity is provided by the Sengi engine, referential
  integrity requires care during development, the NoSQL database will ensure
  consistency of individual record writes.)
- I - Isolated (one operation should not affect another - this is rarely an
  issue.)
- D - Durable (most NoSQL databases will retain data in the event of power
  loss.)

A significant challenge is what to do when sengi rejects an update in the middle
of a set of updates. This could be caused by a transient failure or because the
logic/data supplied was not valid. In this situation some data may have been
written already. In the general case, it is safe to replay any of the previously
issued commands because all mutations are idempotent.

- CREATE, ARCHIVE and PATCH instructions can all be repeated because a digest
  (built from the mutation type, operation id, sequence number and parameters)
  is written to the document when it is changed or created. When a repeat
  instruction is issued the presence of the digest will prevent it being applied
  again. The engine will treat these as successful mutations. When creating or
  mutation multiple documents using identical parameters as part of a single
  operation you must also provide a sequence number of the 2nd update onwards
  will be ignored. Note that a document that is currenlty archived will not be
  archived a second time, although this is based on the archived property rather
  than the digest propery.
- DELETE instructions can all be repeated because the end result is the same. A
  digest is not written to the file for this.

### Querying data across multiple collections

Build concrete views with data pulled from the isolated collections. This should
be done by handling the change events feed that Sengi provides.

Before any mutation is attempted a change event is created and written to a
container. Once the mutation has been successfully applied the change event will
be raised. If the hanlder for the change event raises an error, then an error
will be raised for the whole mutation, even though the document was successfully
mutated. The mutation can be replayed, thanks to the idempontent nature of
mutations, allowing the change event to be handled successfully.

Therefore, change events are guaranteed to be delivered at least once. Duplicate
change events will carry the same payload as the original.

### Batch updates

Either use a separate tool for this or write one-off scripts as the need arises.

## Partition key

Most documents will require a partition key so that the database nows how to
shard the data. Alternatively, you can specify single-partition collections.
These collections will be stored (by default) using the __central_ partition
key. This may simplify access but be aware that this collection will be subject
to the maximum size (document count and data volume) and throughput of a
partition supported by the database.

## Cosmos Setup

Create a Cosmos database and always set an RU limit. This allows us to have
smaller containers that do not require dedicated RUs assigned.

Aim for one doc type per container, however this is not essential because
docType is always passed in the WHERE clause of a SQL query. An individual
container can be assigned dedicated RUs if it's a hot container.

On production, always create indexes for any filters required, including one for
id lookup, based on `partitionKey > docType > id`.
