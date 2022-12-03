# dsengi

A utility for retrieving, storing and mutating documents stored in a NoSQL
database such as Azure Cosmos DB.

You can use Jsonotron to generate interfaces and validation functions for each
document type to be saved.

## Design

A NoSQL database offers a few specific benefits:

- Schemaless backend allows schema to be defined solely within in the coded
  service, which simplifies environment setup and upgrade.
- Data is stored in partitions and thus scales horizontally - allowing specific
  read/write requirements (expressed in RUs) to be made available by the
  database.
- None of the mutations require locks on other tables so performance is
  predictable.
- It can be globally distributed, storing data nearer customers.

However there are a number of specific drawbacks compared to a SQL database:

- Loss of transaction support.
- Loss of aggregation, for example, determining the top 5 records for a given
  ordering requires that all the individual physical containers be queried first
  and then the resultant top 5 determined afterwards.

### Transactions

When working with NoSQL databases, ACID support is not usually available. In
fact, it may not be possible to implement ACID support on a distributed
schemaless database while maintaining predicatable and controllable performance
levels. Other mitigations must be adopted:

- A - Atomic: We assume only a single mutation is performed at a time. See the
  section on idempotence and forward-only recovery below.
- C - Consistency: Data validity is ensured by the Sengi engine. Referential
  integrity requires some care during development.
- I - Isolated: The NoSQL database will ensure consistency of individual record
  writes.
- D - Durable: The NoSQL database will retain data in the event of power loss.

A significant challenge is what to do when sengi rejects an update in the middle
of a set of updates. This could be caused by a transient failure or because the
logic/data supplied was not valid. In this situation some data may have been
written already. While NoSQL databases are ATOMIC within their support for
transactions, such support is rarely sufficient for the types of multi-step
operations that are often required.

Sengi resolves this with a forward-only recovery system. Specifically, all
methods are idempotent, therefore if an error is encountered the operation
should be stored and then replayed later. The replay process ensures the
database is brought back into a known state.

- CREATE, ARCHIVE, REDACT and PATCH instructions can all be repeated because a
  digest (built from the mutation type, operation id, sequence number and
  parameters) is written to the document when it is changed or created. When a
  repeat instruction is issued the presence of the digest will prevent it being
  applied again. The engine will treat these as successful mutations. When
  creating or mutation multiple documents using identical parameters as part of
  a single operation you must also provide a sequence number or the 2nd update
  onwards will be ignored.
- DELETE instructions can all be repeated because the end result is the same. A
  digest is not written to the file for this.

### Change records

It can be useful to handle change information in order to build concrete
denomalised views by combining records from the isolated collections. These
denormalised records need to be updated whenever a constituent record changes.

We do not rely on the underlying change feed of the document store because these
don't always provide the fidilty required. For example, Cosmos does not include
deletions in the change feed, and it does include the before/after fields of
each change.

Before any mutation is attempted a change document is created and written to a
container. This change document includes the values of the changeFieldNames
(defined on the docType) both before and after the mutation. Once the mutation
has been successfully applied the change document is returned along with the
newly modified document.

If an operation is repeated, the original change document is returned. This
allows documents to be repeatedly deleted and patched (perhaps as a recovery is
attempted), with the correct change information returned.

### Batch updates

Either use a separate tool for this or write one-off scripts as the need arises.

## Partition key

Most documents will require a partition key so that the database knows how to
shard the data. Alternatively, you can specify single-partition collections.
These collections will be stored (by default) using the __central_ partition
key. This may simplify access but be aware that this collection will be subject
to the maximum size (document count and data volume) and throughput of a
physical partition supported by the database.

## Cosmos Setup

Create a Cosmos database and always set an RU limit. This allows us to have
smaller containers that do not require dedicated RUs assigned.

Aim for one doc type per container, however this is not essential because
docType is always passed in the WHERE clause of a SQL query. An individual
container can be assigned dedicated RUs if it's a hot container.

On production, always create indexes for any filters required, including one for
id lookup, based on `partitionKey > docType > id`.

Specify a consistency level of SESSION and associate the session-token returned
from write operations with the user that triggered the operation. This ensures
that any subsequent read operations will reflect the previous writes. If this
cannot be achieved then the BOUNDED STALENSS level will serialise changes such
that every node of the service sees the same results but it will double the RU
cost of each query.

## Environment variables

You will need to set the following environment variables to run the tests:

- **COSMOS_URL** The url to the Cosmos db instance, e.g.
  https://myapp.documents.azure.net
- **COSMOS_KEY** The value of the shared access key.

## Commands

Run `deno task test` to test and format.
