# DSengi

The basis of a data layer based on a series of schemas and mutations.

## Migration

In process of migrating from the NodeJS version.

Next up, handle querying multi-partitions with order-by/top clauses:
https://stackoverflow.com/questions/50240232/cosmos-db-rest-api-order-by-with-partitioning
{"code":"BadRequest","message":"The provided cross partition query can not be
directly served by the gateway. This is a first chance (internal) exception that
all newer clients will know how to handle gracefully. This exception is traced,
but unless you see it bubble up as an exception (which only happens on older SDK
clients), then you can safely ignore this message.\r\nActivityId:
fa6fddb8-e8df-493b-9b2e-18c19e5a318a,
Microsoft.Azure.Documents.Common/2.14.0","additionalErrorInfo":"{\"partitionedQueryExecutionInfoVersion\":2,\"queryInfo\":{\"distinctType\":\"None\",\"top\":null,\"offset\":0,\"limit\":2,\"orderBy\":[],\"orderByExpressions\":[],\"groupByExpressions\":[],\"groupByAliases\":[],\"aggregates\":[],\"groupByAliasToAggregateType\":{},\"rewrittenQuery\":\"SELECT
d._etag, d.id\\nFROM Docs AS d\\nOFFSET 0 LIMIT
2\",\"hasSelectValue\":false,\"dCountInfo\":null},\"queryRanges\":[{\"min\":\"\",\"max\":\"FF\",\"isMinInclusive\":true,\"isMaxInclusive\":false}]}"}

Then we're on to the engine itself. There will be changes here to work with the
validator methods that Jsonotron creates from the types, rather than AJV. (It
may be possible to improve the interfacing, given that the types are all coded
now.)

Finally we need a REST layer that is based around Oak rather than Express. Here,
we need to generate the `service.ts` file that we use to generate REST/OpenAPI
interfaces from on the other services (see Email and PDF). The existing
generators should then do most of the scaffolding. And then we need to create
something that builds the `ops` methods automatically, binding the routes to the
functions provided by the sengi engine.
