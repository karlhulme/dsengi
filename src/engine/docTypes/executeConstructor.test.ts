// deno-lint-ignore-file no-explicit-any
import { assertThrows } from "../../../deps.ts";
import {
  DocBase,
  DocType,
  DocTypeConstructor,
  SengiConstructorFailedError,
  SengiConstructorNonObjectResponseError,
  SengiConstructorValidateParametersFailedError,
  SengiCtorParamsValidationFailedError,
  SengiUnrecognisedCtorNameError,
  User,
} from "../../interfaces/index.ts";
import { executeConstructor } from "./executeConstructor.ts";

const dummyUser: User = { id: "test-0001", claims: [] };

interface ExampleDoc extends DocBase {
  propA: string;
}

interface ExampleConstructorParams {
  ctorPropA: string;
}

function createDocType() {
  const docType: DocType<
    ExampleDoc,
    unknown,
    unknown,
    unknown
  > = {
    name: "test",
    pluralName: "tests",
    constructors: {
      make: {
        validateParameters: (params: any) => {
          if (typeof params.ctorPropA !== "string") {
            return "missing string prop ctorPropA";
          } else if (params.ctorPropA === "err") {
            throw new Error("error");
          }
        },
        implementation: (props) => {
          if (props.parameters.ctorPropA === "fail") {
            throw new Error("fail");
          }

          if (props.parameters.ctorPropA === "null") {
            return null as unknown as ExampleDoc;
          }

          return {
            propA: props.parameters.ctorPropA,
          };
        },
      } as DocTypeConstructor<ExampleDoc, ExampleConstructorParams>,
    },
  };

  return docType;
}

Deno.test("Accept valid construction request.", () => {
  executeConstructor(createDocType(), dummyUser, "make", { ctorPropA: "abc" });
});

Deno.test("Reject construction request with an unrecognised name.", () => {
  assertThrows(
    () =>
      executeConstructor(createDocType(), dummyUser, "unrecognised", {
        ctorPropA: "abc",
      }),
    SengiUnrecognisedCtorNameError,
  );
});

Deno.test("Reject construction request if no constructors defined.", () => {
  const docType = createDocType();
  delete docType.constructors;
  assertThrows(
    () =>
      executeConstructor(docType, dummyUser, "unrecognised", {
        ctorPropA: "abc",
      }),
    SengiUnrecognisedCtorNameError,
  );
});

Deno.test("Construction request raises an error if the validateParameters function errors.", () => {
  assertThrows(
    () =>
      executeConstructor(createDocType(), dummyUser, "make", {
        ctorPropA: "err",
      }),
    SengiConstructorValidateParametersFailedError,
  );
});

Deno.test("Reject construction request with invalid parameters.", () => {
  assertThrows(
    () =>
      executeConstructor(createDocType(), dummyUser, "make", {
        ctorPropA: 123,
      }),
    SengiCtorParamsValidationFailedError,
    "missing string prop",
  );
});

Deno.test("Reject construction request if constructor raises error.", () => {
  assertThrows(
    () =>
      executeConstructor(createDocType(), dummyUser, "make", {
        ctorPropA: "fail",
      }),
    SengiConstructorFailedError,
    "fail",
  );
});

Deno.test("Reject construction request if constructor does not return an object.", () => {
  assertThrows(
    () =>
      executeConstructor(createDocType(), dummyUser, "make", {
        ctorPropA: "null",
      }),
    SengiConstructorNonObjectResponseError,
  );
});
