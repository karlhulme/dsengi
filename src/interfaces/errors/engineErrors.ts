import { SengiEngineError } from "./baseErrors.ts";

export class SengiAuthoriseFunctionFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly authoriseFunctionName: string,
    readonly innerErr: Error,
  ) {
    super(
      `Authorise function '${authoriseFunctionName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.authoriseFunctionName = authoriseFunctionName;
    this.innerErr = innerErr;
  }
}

export class SengiCallbackError extends SengiEngineError {
  constructor(readonly callbackName: string, readonly innerErr: Error) {
    super(
      `An error was thrown by the callback delegate for '${callbackName}'\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.callbackName = callbackName;
    this.innerErr = innerErr;
  }
}

export class SengiConstructorFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly constructorName: string,
    readonly innerErr: Error,
  ) {
    super(
      `Constructor '${constructorName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.constructorName = constructorName;
    this.innerErr = innerErr;
  }
}

export class SengiConstructorValidateParametersFailedError
  extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly constructorName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of constructor '${constructorName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.constructorName = constructorName;
    this.innerErr = innerErr;
  }
}

export class SengiConstructorNonObjectResponseError extends SengiEngineError {
  constructor(readonly docTypeName: string, readonly constructorName: string) {
    super(
      `Constructor '${constructorName}' on document type '${docTypeName}' failed to return an object.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.constructorName = constructorName;
  }
}

export class SengiFilterParseFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly filterName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The parse function of filter '${filterName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.filterName = filterName;
    this.innerErr = innerErr;
  }
}

export class SengiFilterValidateParametersFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly filterName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of filter '${filterName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.filterName = filterName;
    this.innerErr = innerErr;
  }
}

export class SengiInvalidOperationPatchError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly operationName: string,
    readonly message: string,
  ) {
    super(
      `Merge patch returned from operation '${operationName}' on document type '${docTypeName}' is invalid.\n${message}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
  }
}

export class SengiOperationAuthoriseFunctionFailedError
  extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly operationName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The authorise function on operation '${operationName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
    this.innerErr = innerErr;
  }
}

export class SengiOperationFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly operationName: string,
    readonly innerErr: Error,
  ) {
    super(
      `Operation '${operationName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
    this.innerErr = innerErr;
  }
}

export class SengiOperationValidateParametersFailedError
  extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly operationName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of operation '${operationName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
    this.innerErr = innerErr;
  }
}

export class SengiPreSaveFailedError extends SengiEngineError {
  constructor(readonly docTypeName: string, readonly innerErr: Error) {
    super(
      `The preSave function on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.innerErr = innerErr;
  }
}

export class SengiQueryAuthoriseFunctionFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The authorise function on query '${queryName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.innerErr = innerErr;
  }
}

export class SengiQueryCoerceFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The coerce function of query '${queryName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.innerErr = innerErr;
  }
}

export class SengiQueryResponseValidationFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly validationError: string,
  ) {
    super(
      `The resulting object from executing query '${queryName}' for doc type '${docTypeName}' did not match the response schema.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.validationError = validationError;
  }
}

export class SengiQueryParseFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The parse function of query '${queryName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.innerErr = innerErr;
  }
}

export class SengiQueryValidateParametersFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateParameters function of query '${queryName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.innerErr = innerErr;
  }
}

export class SengiQueryValidateResponseFailedError extends SengiEngineError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly innerErr: Error,
  ) {
    super(
      `The validateResponse function of query '${queryName}' on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.innerErr = innerErr;
  }
}

export class SengiValidateDocFailedError extends SengiEngineError {
  constructor(readonly docTypeName: string, readonly innerErr: Error) {
    super(
      `The validateDoc function on document type '${docTypeName}' raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.innerErr = innerErr;
  }
}

export class SengiValiateUserFunctionError extends SengiEngineError {
  constructor(readonly innerErr: Error) {
    super(
      `The validateUser function raised an error.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.innerErr = innerErr;
  }
}

export class SengiTypeNotFoundError extends SengiEngineError {
  constructor(readonly typeName: string) {
    super(
      `The fully qualified type name '${typeName}' was not recognised by the validation engine.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.typeName = typeName;
  }
}
