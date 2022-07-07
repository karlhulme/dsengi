import { SengiEngineError } from "./baseErrors.ts";

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
