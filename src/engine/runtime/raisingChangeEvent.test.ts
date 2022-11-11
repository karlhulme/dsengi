// deno-lint-ignore-file require-await
import { assertEquals, spy } from "../../../deps.ts";
import { DocStoreUpsertResultCode } from "../../interfaces/index.ts";
import {
  Car,
  createSengiWithMockStore,
  defaultRequestProps,
} from "./shared.test.ts";

const createDoc = () => ({
  id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  docType: "car",
  docStatus: "active",
  docVersion: "aaaa",
  docOpIds: ["50e02b33-b22c-4207-8785-5a8aa529ec84"],
  docDigests: [
    "9999:A0:6ac951d1db683edc4a3bde31842608f45919b6b4",
  ],
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
});

const newCarTemplate: Partial<Car> = {
  manufacturer: "ford",
  model: "ka",
  registration: "HG12 3AB",
};

Deno.test("Raise an event with the expected fields.", async () => {
  const documentChangedSpy = spy(async () => {});

  const { sengi } = createSengiWithMockStore({
    fetch: async (_docTypeName: string, _partition: string, _id: string) => {
      return {
        // fail to find an existing event, or an existing created doc
        doc: null,
      };
    },
    upsert: async () => ({ code: DocStoreUpsertResultCode.CREATED }),
  }, {
    documentChanged: documentChangedSpy,
  });

  await sengi.newDocument({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    operationId: "00000000-0000-0000-0000-111122223333",
    doc: {
      ...newCarTemplate,
    },
    sequenceNo: "1",
  });

  assertEquals(documentChangedSpy.callCount, 1);

  assertEquals(documentChangedSpy.args[0], [{
    action: "create",
    changeUserId: "user-0001",
    digest: "3333:C1:37ff973bb907562b705d9c573dea1af1ca175ef2",
    subjectDocType: "car",
    subjectFields: {
      manufacturer: "ford",
      model: "ka",
    },
    subjectId: "00000000-1234-1234-1234-000000000000",
    subjectPatchFields: {},
    timestampInMilliseconds: 1629881470000,
  }]);
});

Deno.test("Raise a pre-saved event with the expected fields.", async () => {
  const documentChangedSpy = spy(async () => {});

  const { sengi } = createSengiWithMockStore({
    fetch: async (docTypeName: string, _partition: string, _id: string) => {
      if (docTypeName === "changeEvent") {
        return {
          doc: {
            digest: "abcd",
            action: "archive",
            subjectId: "efgh",
            subjectDocType: "car",
            subjectFields: {
              manufacturer: "ford",
            },
            subjectPatchFields: {},
            timestampInMilliseconds: 1629881000000,
            changeUserId: "user_007",
          },
        };
      } else {
        return {
          doc: createDoc(),
        };
      }
    },
    upsert: async () => ({ code: DocStoreUpsertResultCode.REPLACED }),
  }, {
    documentChanged: documentChangedSpy,
  });

  await sengi.archiveDocument<Car>({
    ...defaultRequestProps,
    raiseChangeEvent: true,
    raiseChangeEventPartition: "diffPartition",
    operationId: "00000000-0000-0000-0000-111122223333",
    id: "06151119-065a-4691-a7c8-2d84ec746ba9",
  });

  assertEquals(documentChangedSpy.callCount, 1);

  assertEquals(documentChangedSpy.args[0], [{
    action: "archive",
    changeUserId: "user_007",
    digest: "abcd",
    subjectDocType: "car",
    subjectFields: {
      manufacturer: "ford",
    },
    subjectId: "efgh",
    subjectPatchFields: {},
    timestampInMilliseconds: 1629881000000,
  }]);
});
