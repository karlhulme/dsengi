export function createSimpleCollection() {
  return {
    "$schema":
      "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/collection.json",
    "system": "db",
    "name": "album",
    "pluralName": "albums",
    "idPrefix": "alb",
    "useSinglePartition": false,
    "summary": "An album",
    "redactFields": [],
    "changeFieldNames": [],
    "storePatches": false,
    "trackChanges": false,
    "properties": [
      {
        "name": "releaseDate",
        "summary": "The release date of the album.",
        "propertyType": "std/date",
        "isRequired": true,
      },
    ],
  };
}

export function createCollectionWithSubTypes() {
  return {
    "$schema":
      "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/collection.json",
    "system": "db",
    "name": "movie",
    "pluralName": "movies",
    "idPrefix": "mov",
    "useSinglePartition": true,
    "summary": "A movie",
    "redactFields": [],
    "changeFieldNames": [],
    "storePatches": true,
    "trackChanges": true,
    "policy": {
      "canDeleteDocuments": true,
    },
    "properties": [
      {
        "name": "title",
        "summary": "The title of the movie.",
        "propertyType": "std/shortStringDisplayable",
        "isRequired": true,
      },
    ],
    "types": {
      "records": [{
        "name": "sub",
        "pluralName": "subs",
        "summary": "A sub record.",
        "properties": [
          {
            "name": "name",
            "summary": "The name of a field.",
            "propertyType": "std/shortString",
            "isRequired": true,
          },
        ],
      }],
      "enums": [{
        "name": "choice",
        "pluralName": "choices",
        "summary": "A choice.",
        "items": [
          {
            "value": "first",
            "summary": "The first choice.",
          },
          {
            "value": "second",
            "summary": "The second choice.",
          },
        ],
      }],
    },
  };
}
