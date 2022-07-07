# DSengi

A utility for retrieving, storing and mutating documents stored in a NoSQL
database such as Azure Cosmos DB.

You can use Jsonotron to generate a typed wrapper for sengi. This is similar to
an ORM, allowing you to work with documents and fields as if they are classes
and fields.

## Todo

- Write tests for the `/src/cosmosClient` namespace.

## Cosmos Setup

Create a Cosmos database and always set an RU limit. This allows us to have
smaller containers that do not require dedicated RUs assigned.

Aim for one doc type per container, however this is not essential because
docType is always passed in the WHERE clause of a SQL query. An individual
container can be assigned dedicated RUs if it's a hot container.

On production, always create indexes for any filters required, including one for
id lookup, based on `partitionKey > docType > id`.
