import { generateCodeForCosmosDatabase } from "./generateCodeForCosmosDatabase.ts";
import { assertStringIncludes, assertThrows } from "../../deps.ts";
import {
  createCollectionWithSubTypes,
  createSimpleCollection,
} from "./shared.test.ts";

Deno.test("Ensure that code can be generated for interacting with a cosmos database.", () => {
  // To cover code generation we need document collections that are:
  // * useSinglePartition: true / false
  // * policy: defined or undefined
  // * records: defined or undefined
  // * enums: defined or undefined
  // * systemUserId: defined or undefined

  const sourceCode = generateCodeForCosmosDatabase([
    {
      $schema:
        "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/db.json",
      appName: "test",
      svcName: "run",
      depsPath: "../deps.ts",
      systemUserId: "user_bespokeSysUser",
    },
    createSimpleCollection(),
    createCollectionWithSubTypes(),
  ]);

  assertStringIncludes(sourceCode, "patchDbMovie");
  assertStringIncludes(sourceCode, "selectDbAlbumsByFilter");
});

Deno.test("Fail to generate cosmos code if no db resource supplied.", () => {
  assertThrows(() =>
    generateCodeForCosmosDatabase([
      createSimpleCollection(),
    ]), "db resource");
});

Deno.test("Fail to generate cosmos code if no collection resources supplied.", () => {
  assertThrows(() =>
    generateCodeForCosmosDatabase([
      {
        $schema:
          "https://raw.githubusercontent.com/karlhulme/dsengi/main/schemas/db.json",
        appName: "test",
        svcName: "run",
        depsPath: "../deps.ts",
        systemUserId: "user_bespokeSysUser",
      },
    ]), "collection resources");
});
