import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  SengiDocValidationFailedError,
  SengiValidateDocFailedError,
} from "../../interfaces/index.ts";
import { executeValidateDoc } from "./executeValidateDoc.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

function createDoc(): ExampleDoc {
  return {
    propA: "",
    id: "123",
    docType: "test",
    docStatus: "active",
    docOpIds: [],
    docDigests: [],
    docVersion: "1234",
    docCreatedMillisecondsSinceEpoch: 1234,
    docCreatedByUserId: "anon",
    docLastUpdatedMillisecondsSinceEpoch: 1234,
    docLastUpdatedByUserId: "anon",
  };
}

Deno.test("Executing a validator against valid data raises no errors.", () => {
  executeValidateDoc<ExampleDoc>(
    "test",
    () => {},
    () => {},
    createDoc(),
  );
});

Deno.test("Reject a doc if the validation of fields or doc fails.", () => {
  assertThrows(
    () =>
      executeValidateDoc<ExampleDoc>(
        "test",
        () => {
          return "invalid fields";
        },
        () => {},
        createDoc(),
      ),
    SengiDocValidationFailedError,
    "invalid fields",
  );

  assertThrows(
    () =>
      executeValidateDoc<ExampleDoc>(
        "test",
        () => {},
        () => {
          return "invalid doc";
        },
        createDoc(),
      ),
    SengiDocValidationFailedError,
    "invalid doc",
  );
});

Deno.test("Reject a doc if validation functions of fields or docs raises an error.", () => {
  assertThrows(
    () =>
      executeValidateDoc<ExampleDoc>(
        "test",
        () => {
          throw new Error("fields validation threw");
        },
        () => {},
        createDoc(),
      ),
    SengiValidateDocFailedError,
    "fields validation threw",
  );

  assertThrows(
    () =>
      executeValidateDoc<ExampleDoc>(
        "test",
        () => {},
        () => {
          throw new Error("docs validation threw");
        },
        createDoc(),
      ),
    SengiValidateDocFailedError,
    "docs validation threw",
  );
});
