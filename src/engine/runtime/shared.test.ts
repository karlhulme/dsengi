// deno-lint-ignore-file require-await no-explicit-any
import { assertEquals } from "../../../deps.ts";
import {
  Client,
  DocStore,
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
  DocType,
  DocTypeConstructor,
  DocTypeOperation,
} from "../../interfaces/index.ts";
import { Sengi, SengiConstructorProps } from "./Sengi.ts";

export interface TestDocStoreOptions {
  custom: string;
}

export interface Car {
  id?: string;
  docType?: string;
  docOpIds?: string[];
  docVersion?: string;
  manufacturer?: string;
  model?: string;
  registration?: string;
  /**
   * @deprecated
   */
  originalOwner?: string;
  engineCode?: string;
}

export function createCarDocType(): DocType<
  Car,
  TestDocStoreOptions,
  string,
  string
> {
  return {
    name: "car",
    pluralName: "cars",
    summary: "A car",
    validateDoc: (doc: any) => {
      if (typeof doc !== "object") {
        return "Doc is not an object";
      }

      if (!["string", "undefined"].includes(typeof doc.manufacturer)) {
        return "Field manufacturer must be a string";
      }

      if (!["string", "undefined"].includes(typeof doc.model)) {
        return "Field model must be a string";
      }

      if (!["string", "undefined"].includes(typeof doc.registration)) {
        return "Field registration must be a string";
      }

      if (doc.registration && !(doc.registration as string).startsWith("HG")) {
        return "Unrecognised vehicle registration prefix.";
      }

      if (!["string", "undefined"].includes(typeof doc.originalOwner)) {
        return "Field originalOwner must be a string";
      }
    },
    readOnlyFieldNames: ["manufacturer"],
    policy: {
      canDeleteDocuments: true,
      canReplaceDocuments: true,
      canFetchWholeCollection: true,
      maxOpIds: 5,
    },
    constructors: {
      regTesla: {
        validateParameters: (params) => {
          if (typeof params !== "string") {
            return "Argument params must be a string.";
          }
        },
        implementation: (props) => ({
          manufacturer: "tesla",
          model: "T",
          registration: props.parameters,
        }),
      } as DocTypeConstructor<Car, string>,
    },
    filters: {
      byModel: {
        validateParameters: (params: any) => {
          if (typeof params !== "string") {
            return "Must be a string.";
          }
        },
        parse: (props) => `MODEL=${props.parameters}`,
      },
    },
    operations: {
      upgradeModel: {
        validateParameters: (params) => {
          if (typeof params !== "number") {
            return "Argument params must be a number.";
          }
        },
        implementation: (props) => {
          props.doc.model = props.doc.model + props.parameters;
        },
      } as DocTypeOperation<Car, string>,
    },
    queries: {
      count: {
        validateParameters: (params: any) => {
          if (typeof params !== "string") {
            return "Must be a string.";
          }
        },
        parse: (props) => `COUNT ${props.parameters}`,
        validateResponse: (response: any) => {
          if (typeof response !== "number") {
            return "Must be a number.";
          }
        },
        coerce: (result) => result,
      },
    },
    preSave: (props) => {
      if (props.doc.originalOwner) {
        delete props.doc.originalOwner;
      }
    },
    authorisePatch: (props) => {
      if (props.fieldNames.includes("engineCode")) {
        return "engineCode is private.";
      }
    },
    docStoreOptions: {
      custom: "prop",
    },
  };
}

function createAdminClient(): Client {
  return {
    name: "admin",
    docPermissions: true,
    apiKeys: ["adminKey"],
  };
}

function createNoneClient(): Client {
  return {
    name: "none",
    docPermissions: false,
    apiKeys: ["noneKey"],
  };
}

export function createMockStore(
  docStoreOverrides?: Record<string, unknown>,
): DocStore<TestDocStoreOptions, string, string> {
  return Object.assign({
    deleteById: async () => ({ code: DocStoreDeleteByIdResultCode.NOT_FOUND }),
    exists: async () => ({ found: false }),
    fetch: async () => ({ doc: null }),
    query: async () => ({ data: 0 }),
    selectAll: async () => ({ docs: [] }),
    selectByFilter: async () => ({ docs: [] }),
    selectByIds: async () => ({ docs: [] }),
    upsert: async () => ({
      code: DocStoreUpsertResultCode.VERSION_NOT_AVAILABLE,
    }),
  }, docStoreOverrides);
}

export interface TestRequestProps {
  foo?: string;
}

interface SengiTestObjects {
  sengi: Sengi<
    TestRequestProps,
    TestDocStoreOptions,
    string,
    string
  >;
  sengiCtorProps: SengiConstructorProps<
    TestRequestProps,
    TestDocStoreOptions,
    string,
    string
  >;
  docStore: DocStore<TestDocStoreOptions, string, string>;
  carDocType: DocType<
    Car,
    TestDocStoreOptions,
    string,
    string
  >;
  adminClient: Client;
}

export const createSengiWithMockStore = (
  docStoreOverrides?: Record<string, unknown>,
  sengiCtorOverrides?: Record<string, unknown>,
): SengiTestObjects => {
  const docStore = createMockStore(docStoreOverrides);

  const carDocType = createCarDocType();

  const adminClient = createAdminClient();
  const noneClient = createNoneClient();

  const sengiCtorProps = Object.assign({
    docTypes: [carDocType],
    clients: [adminClient, noneClient],
    docStore,
    validateUserId: (userId: any) => {
      if (typeof userId !== "string") {
        return "Field userId must be a string.";
      }
    },
    getMillisecondsSinceEpoch: () => 1629881470000,
  }, sengiCtorOverrides) as unknown as SengiConstructorProps<
    TestRequestProps,
    TestDocStoreOptions,
    string,
    string
  >;

  const sengi = new Sengi<
    TestRequestProps,
    TestDocStoreOptions,
    string,
    string
  >(sengiCtorProps);

  return {
    sengi,
    sengiCtorProps,
    docStore,
    carDocType,
    adminClient,
  };
};

export const defaultRequestProps = {
  docTypeName: "car",
  partition: "_central",
  apiKey: "adminKey",
  reqProps: { foo: "bar" },
  docStoreOptions: { custom: "prop" },
  userId: "user-0001",
  userClaims: [],
};

Deno.test("createSengiWithMockStore creates a valid sengi object.", async () => {
  const objects = createSengiWithMockStore({});
  assertEquals(typeof objects.sengi, "object");
  assertEquals(typeof objects.sengiCtorProps, "object");
  assertEquals(typeof objects.docStore, "object");
});
