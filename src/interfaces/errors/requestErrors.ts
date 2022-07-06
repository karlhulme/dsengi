import { SengiRequestError } from "./baseErrors.ts";

export class SengiActionForbiddenByPolicyError extends SengiRequestError { // HTTP 403
  constructor(readonly docTypeName: string, readonly action: string) {
    super(`Access policy for '${docTypeName}' forbids the action '${action}'.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiConflictOnSaveError extends SengiRequestError { // HTTP 409
  constructor() {
    super(
      "Document could not be updated as it was changed by another process during the operation.",
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiCtorParamsValidationFailedError extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to constructor for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiDocValidationFailedError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly validationError: string) {
    super(
      `The values supplied are not a valid instance of doc type '${docTypeName}'.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiDocNotFoundError extends SengiRequestError { // HTTP 404
  constructor(readonly docTypeName: string, readonly id: string) {
    super(
      `Document of type '${docTypeName}' with id '${id}' was not found in the document store.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiDocIdMissing extends SengiRequestError {
  constructor() {
    super(
      `A new document was supplied without an id property.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiOperationParamsValidationFailedError
  extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to operation for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiPatchValidationFailedError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly validationError: string) {
    super(
      `The parameters supplied for a patch for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiQueryParamsValidationFailedError extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to query for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiRequiredVersionNotAvailableError extends SengiRequestError { // HTTP 412
  constructor() {
    super("Required version of document is not available in the doc store.");
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiUnrecognisedDocTypeNameError extends SengiRequestError {
  constructor(readonly docTypeName: string) {
    super(`A document type named '${docTypeName}' is not defined.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiUserIdValidationFailedError extends SengiRequestError {
  constructor(readonly userId: string, readonly validationError: string) {
    super(`The user id '${userId}' was not valid.\n${validationError}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}
