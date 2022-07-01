import { assertEquals, assertThrows } from "../../../deps.ts";
import {
  DocBase,
  SengiConstructorFailedError,
  SengiConstructorNonObjectResponseError,
  SengiConstructorValidateParametersFailedError,
  SengiCtorParamsValidationFailedError,
} from "../../interfaces/index.ts";
import { executeConstructor } from "./executeConstructor.ts";

interface ExampleDoc extends DocBase {
  propA: string;
}

interface ExampleConstructorParams {
  ctorPropA: string;
}

Deno.test("Accept valid construction request.", () => {
  const doc = executeConstructor<ExampleDoc, ExampleConstructorParams>(
    "test",
    () => {},
    (params) => ({
      propA: params.ctorPropA,
    }),
    {
      ctorPropA: "foo",
    },
    "me",
  );

  assertEquals(doc, { propA: "foo" });
});

Deno.test("Construction request raises an error if the validateParameters function errors.", () => {
  assertThrows(
    () =>
      executeConstructor<ExampleDoc, ExampleConstructorParams>(
        "test",
        () => {
          throw new Error("func threw");
        },
        (params) => ({
          propA: params.ctorPropA,
        }),
        {
          ctorPropA: "foo",
        },
        "me",
      ),
    SengiConstructorValidateParametersFailedError,
    "func threw",
  );
});

Deno.test("Reject construction request with invalid parameters.", () => {
  assertThrows(
    () =>
      executeConstructor<ExampleDoc, ExampleConstructorParams>(
        "test",
        () => {
          return "invalid params";
        },
        (params) => ({
          propA: params.ctorPropA,
        }),
        {
          ctorPropA: "foo",
        },
        "me",
      ),
    SengiCtorParamsValidationFailedError,
    "invalid params",
  );
});

Deno.test("Reject construction request if constructor raises error.", () => {
  assertThrows(
    () =>
      executeConstructor<ExampleDoc, ExampleConstructorParams>(
        "test",
        () => {},
        () => {
          throw new Error("ctor threw");
        },
        {
          ctorPropA: "foo",
        },
        "me",
      ),
    SengiConstructorFailedError,
    "ctor threw",
  );
});

Deno.test("Reject construction request if constructor does not return an object.", () => {
  assertThrows(
    () =>
      executeConstructor<ExampleDoc, ExampleConstructorParams>(
        "test",
        () => {},
        () => "unexpected" as unknown as ExampleDoc,
        {
          ctorPropA: "foo",
        },
        "me",
      ),
    SengiConstructorNonObjectResponseError,
  );
});
