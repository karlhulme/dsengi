import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  DocTypeOperation,
  DocTypeQuery,
  SengiAuthorisationFailedError,
  SengiAuthoriseFunctionFailedError,
  SengiOperationAuthoriseFunctionFailedError,
  SengiQueryAuthoriseFunctionFailedError,
} from "../../interfaces/index.ts";
import {
  ensureDocTypeCreateRequestAuthorised,
  ensureDocTypeDeleteRequestAuthorised,
  ensureDocTypeOperationRequestAuthorised,
  ensureDocTypePatchRequestAuthorised,
  ensureDocTypeQueryRequestAuthorised,
  ensureDocTypeReadRequestAuthorised,
} from "./ensureDocTypeRequestAuthorised.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    queries: {
      testQuery: {
        coerce: () => ({}),
        parse: () => ({}),
        authorise: (props) => {
          if (props.parameters.foo === "private") {
            return "something";
          } else if (props.parameters.foo === "error") {
            throw new Error("auth-err");
          }
        },
      },
    },
    operations: {
      testOperation: {
        authorise: (props) => {
          if (props.originalDoc.propA === "private") {
            return "OpDenied";
          } else if (props.originalDoc.propA === "error") {
            throw new Error("auth-err");
          }
        },
        implementation: () => {},
      },
    },
    authoriseCreate: (props) => {
      if (props.newDoc.propA === "private") {
        return "ReadDenied";
      } else if (props.newDoc.propA === "error") {
        throw new Error("auth-err");
      }
    },
    authoriseDelete: (props) => {
      if (props.doc.propA === "private") {
        return "CreateDenied";
      } else if (props.doc.propA === "error") {
        throw new Error("auth-err");
      }
    },
    authorisePatch: (props) => {
      if (props.originalDoc.propA === "private") {
        return "PatchDenied";
      } else if (props.originalDoc.propA === "error") {
        throw new Error("auth-err");
      }
    },
    authoriseRead: (props) => {
      if (props.fieldNames.includes("private")) {
        return "ReadDenied";
      } else if (props.fieldNames.includes("error")) {
        throw new Error("auth-err");
      }
    },
  };

  return docType;
}

Deno.test("Silent return if auth method is not defined.", () => {
  const docType = createDocType();

  delete docType.operations?.testOperation.authorise;
  delete docType.queries?.testQuery.authorise;
  delete docType.authoriseCreate;
  delete docType.authoriseDelete;
  delete docType.authorisePatch;
  delete docType.authoriseRead;

  ensureDocTypeCreateRequestAuthorised(docType, {
    user: {},
    newDoc: {},
    requestType: "create",
  });
  ensureDocTypeDeleteRequestAuthorised(docType, { user: {}, doc: {} });
  ensureDocTypePatchRequestAuthorised(docType, {
    user: {},
    fieldNames: [],
    originalDoc: {},
    patch: {},
  });
  ensureDocTypeReadRequestAuthorised(docType, {
    user: {},
    fieldNames: [],
    doc: {},
    requestType: "selectByFilter",
  });
  ensureDocTypeQueryRequestAuthorised(
    docType,
    "testQuery",
    docType.queries?.testQuery as DocTypeQuery<
      unknown,
      unknown,
      unknown,
      unknown
    >,
    { user: {}, parameters: {} },
  );
  ensureDocTypeOperationRequestAuthorised(
    docType,
    "testOperation",
    docType.operations?.testOperation as DocTypeOperation<
      unknown,
      unknown,
      unknown
    >,
    { user: {}, parameters: {}, originalDoc: {} },
  );
});

Deno.test("Silent return if auth method returns void.", () => {
  const docType = createDocType();
  ensureDocTypeCreateRequestAuthorised(docType, {
    user: {},
    newDoc: {},
    requestType: "create",
  });
  ensureDocTypeDeleteRequestAuthorised(docType, { user: {}, doc: {} });
  ensureDocTypePatchRequestAuthorised(docType, {
    user: {},
    fieldNames: [],
    originalDoc: {},
    patch: {},
  });
  ensureDocTypeReadRequestAuthorised(docType, {
    user: {},
    fieldNames: [],
    doc: {},
    requestType: "selectByFilter",
  });
  ensureDocTypeQueryRequestAuthorised(
    docType,
    "testQuery",
    docType.queries?.testQuery as DocTypeQuery<
      unknown,
      unknown,
      unknown,
      unknown
    >,
    { user: {}, parameters: {} },
  );
  ensureDocTypeOperationRequestAuthorised(
    docType,
    "testOperation",
    docType.operations?.testOperation as DocTypeOperation<
      unknown,
      unknown,
      unknown
    >,
    { user: {}, parameters: {}, originalDoc: {} },
  );
});

Deno.test("Raise error if auth method returns a string.", () => {
  const docType = createDocType();
  assertThrows(
    () =>
      ensureDocTypeCreateRequestAuthorised(docType, {
        user: {},
        newDoc: { propA: "private" },
        requestType: "create",
      }),
    SengiAuthorisationFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeDeleteRequestAuthorised(docType, {
        user: {},
        doc: { propA: "private" },
      }),
    SengiAuthorisationFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypePatchRequestAuthorised(docType, {
        user: {},
        fieldNames: [],
        originalDoc: { propA: "private" },
        patch: {},
      }),
    SengiAuthorisationFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeReadRequestAuthorised(docType, {
        user: {},
        fieldNames: ["private"],
        doc: {},
        requestType: "selectByFilter",
      }),
    SengiAuthorisationFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeQueryRequestAuthorised(
        docType,
        "testQuery",
        docType.queries?.testQuery as DocTypeQuery<
          unknown,
          unknown,
          unknown,
          unknown
        >,
        { user: {}, parameters: { foo: "private" } },
      ),
    SengiAuthorisationFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeOperationRequestAuthorised(
        docType,
        "testOperation",
        docType.operations?.testOperation as DocTypeOperation<
          unknown,
          unknown,
          unknown
        >,
        { user: {}, parameters: {}, originalDoc: { propA: "private" } },
      ),
    SengiAuthorisationFailedError,
  );
});

Deno.test("Raise error if auth method raises an error.", () => {
  const docType = createDocType();
  assertThrows(
    () =>
      ensureDocTypeCreateRequestAuthorised(docType, {
        user: {},
        newDoc: { propA: "error" },
        requestType: "create",
      }),
    SengiAuthoriseFunctionFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeDeleteRequestAuthorised(docType, {
        user: {},
        doc: { propA: "error" },
      }),
    SengiAuthoriseFunctionFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypePatchRequestAuthorised(docType, {
        user: {},
        fieldNames: [],
        originalDoc: { propA: "error" },
        patch: {},
      }),
    SengiAuthoriseFunctionFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeReadRequestAuthorised(docType, {
        user: {},
        fieldNames: ["error"],
        doc: {},
        requestType: "selectByFilter",
      }),
    SengiAuthoriseFunctionFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeQueryRequestAuthorised(
        docType,
        "testQuery",
        docType.queries?.testQuery as DocTypeQuery<
          unknown,
          unknown,
          unknown,
          unknown
        >,
        { user: {}, parameters: { foo: "error" } },
      ),
    SengiQueryAuthoriseFunctionFailedError,
  );
  assertThrows(
    () =>
      ensureDocTypeOperationRequestAuthorised(
        docType,
        "testOperation",
        docType.operations?.testOperation as DocTypeOperation<
          unknown,
          unknown,
          unknown
        >,
        { user: {}, parameters: {}, originalDoc: { propA: "error" } },
      ),
    SengiOperationAuthoriseFunctionFailedError,
  );
});