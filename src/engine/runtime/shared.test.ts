// deno-lint-ignore-file require-await no-explicit-any
import { assertEquals } from "../../../deps.ts";
import {
  DocBase,
  DocStore,
  DocStoreDeleteByIdResultCode,
  DocStoreUpsertResultCode,
  DocType,
} from "../../interfaces/index.ts";
import { Sengi, SengiConstructorProps } from "./Sengi.ts";

export interface TestDocStoreParams {
  custom: string;
}

export interface Car extends DocBase {
  manufacturer?: string;
  model?: string;
  registration?: string;
  /**
   * @deprecated
   */
  originalOwner?: string;
  engineCode?: string;
}

export function createCarDocType(): DocType {
  return {
    name: "car",
    readOnlyFieldNames: ["manufacturer"],
    policy: {
      canDeleteDocuments: true,
      canReplaceDocuments: true,
      canFetchWholeCollection: true,
      maxOpIds: 5,
    },
    validateDoc: (doc: Car) => {
      if (doc.registration && !(doc.registration as string).startsWith("HG")) {
        return "Unrecognised vehicle registration prefix.";
      }

      if (doc.originalOwner) {
        delete doc.originalOwner;
      }
    },
    validateFields: (doc) => {
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

      if (!["string", "undefined"].includes(typeof doc.originalOwner)) {
        return "Field originalOwner must be a string";
      }
    },
    validatePatch: (patch) => {
      if (typeof patch !== "object") {
        return "Patch is not an object";
      }

      if (!["string", "undefined"].includes(typeof patch.manufacturer)) {
        return "Field manufacturer must be a string";
      }

      if (!["string", "undefined"].includes(typeof patch.model)) {
        return "Field model must be a string";
      }

      if (!["string", "undefined"].includes(typeof patch.registration)) {
        return "Field registration must be a string";
      }

      if (!["string", "undefined"].includes(typeof patch.originalOwner)) {
        return "Field originalOwner must be a string";
      }
    },
  };
}

export function createMockStore(
  docStoreOverrides?: Record<string, unknown>,
): DocStore<TestDocStoreParams, string, string> {
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
  }, docStoreOverrides) as unknown as DocStore<
    TestDocStoreParams,
    string,
    string
  >;
}

interface SengiTestObjects {
  sengi: Sengi<
    TestDocStoreParams,
    string,
    string
  >;
  sengiCtorProps: SengiConstructorProps<
    TestDocStoreParams,
    string,
    string
  >;
  docStore: DocStore<TestDocStoreParams, string, string>;
  carDocType: DocType;
}

export const createSengiWithMockStore = (
  docStoreOverrides?: Record<string, unknown>,
  sengiCtorOverrides?: Record<string, unknown>,
): SengiTestObjects => {
  const docStore = createMockStore(docStoreOverrides);

  const carDocType = createCarDocType();

  const sengiCtorProps = Object.assign({
    docTypes: [carDocType],
    docStore,
    validateUserId: (userId: any) => {
      if (typeof userId !== "string") {
        return "Field userId must be a string.";
      }
    },
    getMillisecondsSinceEpoch: () => 1629881470000,
  }, sengiCtorOverrides) as unknown as SengiConstructorProps<
    TestDocStoreParams,
    string,
    string
  >;

  const sengi = new Sengi<
    TestDocStoreParams,
    string,
    string
  >(sengiCtorProps);

  return {
    sengi,
    sengiCtorProps,
    docStore,
    carDocType,
  };
};

export const defaultRequestProps = {
  docTypeName: "car",
  partition: "_central",
  docStoreParams: { custom: "prop" },
  userId: "user-0001",
};

Deno.test("createSengiWithMockStore creates a valid sengi object.", async () => {
  const objects = createSengiWithMockStore({});
  assertEquals(typeof objects.sengi, "object");
  assertEquals(typeof objects.sengiCtorProps, "object");
  assertEquals(typeof objects.docStore, "object");
});
