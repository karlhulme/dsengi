# DSengi

The basis of a data layer based on a series of schemas and mutations.

## Migration

In process of migrating from the NodeJS version.

We're on to the engine itself! There will be changes here to work with the
validator methods that Jsonotron creates from the types, rather than AJV. (It
may be possible to improve the interfacing, given that the types are all coded
now.)

Finally we need a REST layer that is based around Oak rather than Express. Here,
we need to generate the `service.ts` file that we use to generate REST/OpenAPI
interfaces from on the other services (see Email and PDF). The existing
generators should then do most of the scaffolding. And then we need to create
something that builds the `ops` methods automatically, binding the routes to the
functions provided by the sengi engine.
