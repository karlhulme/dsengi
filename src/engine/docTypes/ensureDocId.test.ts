import { assertThrows } from "../../../deps.ts";
import { SengiDocIdMissing } from "../../interfaces/index.ts";
import { ensureDocId } from "./ensureDocId.ts";

Deno.test("A valid doc is accepted.", () => {
  ensureDocId({ id: "valid" });
});

Deno.test("A doc without an id is rejected.", () => {
  assertThrows(
    () => ensureDocId({}),
    SengiDocIdMissing,
  );
});
