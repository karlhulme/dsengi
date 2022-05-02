import { assertThrows } from "../../../deps.ts";
import { SengiNewDocIdMismatch } from "../../interfaces/index.ts";
import { ensureNewDocIdsMatch } from "./ensureNewDocIdsMatch.ts";

Deno.test("A doc with no id property does not conflict with request id.", () => {
  ensureNewDocIdsMatch("1234");
});

Deno.test("A doc with an id property that matches the request id is accepted.", () => {
  ensureNewDocIdsMatch("1234", "1234");
});

Deno.test("A doc with an id property that conflicts with the request id raises an error.", () => {
  assertThrows(
    () => ensureNewDocIdsMatch("1234", "5678"),
    SengiNewDocIdMismatch,
  );
});
