import { SengiEngineError } from "./baseErrors.ts";

export class SengiConstructorFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly innerErr: Error,
  ) {
    super(
      `Constructor on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiConstructorValidateParametersFailedError
  extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of constructor on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiConstructorNonObjectResponseError extends SengiEngineError {
  constructor(readonly docTypeName: string) {
    super(
      `Constructor on document type '${docTypeName}' failed to return an object.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiOperationFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly innerErr: Error,
  ) {
    super(
      `Operation on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiOperationValidateParametersFailedError
  extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of operation on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiQueryCoerceFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The coerce function of query on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiValidateDocFailedError extends SengiEngineError {
  constructor(readonly docTypeName: string, readonly innerErr: Error) {
    super(
      `The validateDoc function on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SengiValidatePatchFailedError extends SengiEngineError {
  constructor(readonly docTypeName: string, readonly innerErr: Error) {
    super(
      `The validatePatch function on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class SengiValidateUserIdFunctionError extends SengiEngineError {
  constructor(readonly innerErr: Error) {
    super(
      `The validateUserId function raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.innerErr = innerErr;
  }
}
