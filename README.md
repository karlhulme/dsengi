# DSengi

The basis of a data layer based on a series of schemas and mutations.

## Migration

In process of migrating from the NodeJS version.

Engine work: next up is isOpIdInDocument

Finally we need a REST layer that is based around Oak rather than Express. Here,
we need to generate the `service.ts` file that we use to generate REST/OpenAPI
interfaces from on the other services (see Email and PDF). The existing
generators should then do most of the scaffolding. And then we need to create
something that builds the `ops` methods automatically, binding the routes to the
functions provided by the sengi engine.

Re-order this: appendDocOpIds/manually set applyCommonFieldValuesToDoc(doc,
this.getTimestamp(), this.getUserId(user)) executePreSave(docType, doc, user)
ensureDoc(this.ajv, docType, doc) executeValidator(docType, doc)

To this: appendDocOpIds/manually set applyCommonFieldValuesToDoc(doc,
this.getTimestamp(), this.getUserId(user)) executePreSave(docType, doc, user) //
edits document as it sees fit executeValidator(docType, doc) // uses validate
function and thus may remove fields too ensureDoc(this.ajv, docType, doc) //
ensures system fields are present
