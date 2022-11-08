import { SengiEngineError } from "./baseErrors.ts";

export class SengiMissingNewIdFunctionError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
  ) {
    super(
      `The newId function of document type '${docTypeName}' is not defined or failed to return a string.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiMissingChangeEventsConfigError extends SengiEngineError {
  constructor(
    readonly settingName: string,
  ) {
    super(
      `The setting '${settingName}' must be specified in order to emit change events.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiMissingPatchConfigError extends SengiEngineError {
  constructor(
    readonly settingName: string,
  ) {
    super(
      `The setting '${settingName}' must be specified in order to record document patches.`,
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
