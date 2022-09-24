# DSengi

A utility for retrieving, storing and mutating documents stored in a NoSQL
database such as Azure Cosmos DB.

You can use Jsonotron to generate interfaces for each document type to be saved.

## Todo

- Write tests for the `/src/cosmosClient` namespace / separate out.

## Design

A NoSQL database offers a few specific benefits:

- Schemaless, allowing changes to be made solely in the design layer.
- Data is stored in partitions and thus scales horizontally with performance
  maintained.
- None of the mutations require locks so performance is maintained.
- It can be globally distributed, storing data nearer customers.

However there are a number of specific lost benefits:

- Loss of transaction support.
- Querying data across multiple collections, since collections can (and will) be
  stored on separate servers.
- Batch updates to multiple records.

### Transactions

When working with NoSQL databases, ACID support is not usually available. In
fact, it may not be possible to implement ACID support on a distributed
schemaless database while maintaining predicatable and controllable performance
levels. Other mitigations must be adopted:

- A - Atomic (must be aware that data is eventually consistency when reading.)
- C - Consistency (data validity is provided by the Sengi engine, referential
  integrity requires care during development, the NoSQL database will ensure
  consistency of individual record writes.)
- I - Isolated (this is rarely an issue.)
- D - Durable (most NoSQL databases will retain data in the event of power
  loss.)

A significant challenge is what to do when sengi rejects an update in the middle
of a set of updates. This could be transient reasons or because the logic/data
supplied was not valid. In this situation some data may have been written
already. The mitigation strategy here is to ensure that any sequence of database
updates can be issued again without harm:

- DELETE, ARCHIVE and PATCH instructions can all be repeated because the end
  result is the same.
- CREATE instructions will leave new records in the database, therefore:
  - A single create instruction should be the final element of any atomic step
    (e.g. service request) before success is returned.
  - The process should identify and remove previously created records first.  This can be done by searching for records that include the operationId in the docOpIds array.

### Querying data across multiple collections

Build concrete views with data pulled from the isolated collections. This can be done
on a timer, on command, on whenever constituent records are detected to have
changed.

### Batch updates

Either use a separate tool for this or write one-off scripts as the need arises.

## Partition key

Most documents will require a partition key so that the database nows how to shard the data.  Alternatively, you can specify single-partition collections.  These collections will be stored (by default) using the *_central* partition key.  This may simplify access but be aware that this collection will be subject to the maximum size (document count and data volume) and throughput of a partition supported by the database.

## Cosmos Setup

Create a Cosmos database and always set an RU limit. This allows us to have
smaller containers that do not require dedicated RUs assigned.

Aim for one doc type per container, however this is not essential because
docType is always passed in the WHERE clause of a SQL query. An individual
container can be assigned dedicated RUs if it's a hot container.

On production, always create indexes for any filters required, including one for
id lookup, based on `partitionKey > docType > id`.
