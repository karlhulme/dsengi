import { SengiRequestError } from "./baseErrors.ts";

export class SengiActionForbiddenByPolicyError extends SengiRequestError { // HTTP 403
  constructor(readonly docTypeName: string, readonly action: string) {
    super(`Access policy for '${docTypeName}' forbids the action '${action}'.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.action = action;
  }
}

export class SengiAuthorisationFailedError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly reason: string) {
    super(
      `The requested action on doc type '${docTypeName}' was not authorised for the current user.\n${reason}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.reason = reason;
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
    readonly ctorName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to constructor '${ctorName}' for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.ctorName = ctorName;
    this.validationError = validationError;
  }
}

export class SengiDocValidationFailedError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly validationError: string) {
    super(
      `The values supplied are not a valid instance of doc type '${docTypeName}'.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.validationError = validationError;
  }
}

export class SengiDocNotFoundError extends SengiRequestError { // HTTP 404
  constructor(readonly docTypeName: string, readonly id: string) {
    super(
      `Document of type '${docTypeName}' with id '${id}' was not found in the document store.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.id = id;
  }
}

export class SengiFilterParamsValidationFailedError extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly filterName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to filter '${filterName}' for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.filterName = filterName;
    this.validationError = validationError;
  }
}

export class SengiInsufficientPermissionsError extends SengiRequestError {
  constructor(
    readonly clientName: string,
    readonly docTypeName: string,
    readonly action: string,
  ) {
    super(
      `The '${clientName}' client does not have permission to perform action '${action}' on '${docTypeName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.clientName = clientName;
    this.docTypeName = docTypeName;
    this.action = action;
  }
}

export class SengiUnrecognisedApiKeyError extends SengiRequestError {
  constructor() {
    super(`The client supplied an invalid api key.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiNewDocIdMismatch extends SengiRequestError {
  constructor(readonly docId?: string, readonly requestId?: string) {
    super(
      `The id property of the new document '${docId}' was supplied but does not match the id of the request '${requestId}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docId = docId;
    this.requestId = requestId;
  }
}

export class SengiOperationParamsValidationFailedError
  extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly operationName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to operation '${operationName}' for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
    this.validationError = validationError;
  }
}

export class SengiPatchValidationFailedError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly validationError: string) {
    super(
      `The parameters supplied for a patch for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.validationError = validationError;
  }
}

export class SengiQueryParamsValidationFailedError extends SengiRequestError {
  constructor(
    readonly docTypeName: string,
    readonly queryName: string,
    readonly validationError: string,
  ) {
    super(
      `The parameters supplied to query '${queryName}' for doc type '${docTypeName}' were not valid.\n${validationError}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
    this.validationError = validationError;
  }
}

export class SengiRequiredVersionNotAvailableError extends SengiRequestError { // HTTP 412
  constructor() {
    super("Required version of document is not available in the doc store.");
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

export class SengiUnrecognisedCtorNameError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly ctorName: string) {
    super(
      `Document type '${docTypeName}' does not define a constructor named '${ctorName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.ctorName = ctorName;
  }
}

export class SengiUnrecognisedDocTypeNameError extends SengiRequestError {
  constructor(readonly docTypeName: string) {
    super(`A document type named '${docTypeName}' is not defined.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
  }
}

export class SengiUnrecognisedFieldNameError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly fieldName: string) {
    super(
      `Document type '${docTypeName}' does not define a field named '${fieldName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.fieldName = fieldName;
  }
}

export class SengiUnrecognisedFilterNameError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly filterName: string) {
    super(
      `Document type '${docTypeName}' does not define a filter named '${filterName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.filterName = filterName;
  }
}

export class SengiUnrecognisedOperationNameError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly operationName: string) {
    super(
      `Document type '${docTypeName}' does not define an operation named '${operationName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.operationName = operationName;
  }
}

export class SengiUnrecognisedQueryNameError extends SengiRequestError {
  constructor(readonly docTypeName: string, readonly queryName: string) {
    super(
      `Document type '${docTypeName}' does not define a query named '${queryName}'.`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.docTypeName = docTypeName;
    this.queryName = queryName;
  }
}

export class SengiUserValidationFailedError extends SengiRequestError {
  constructor(readonly validationError: string) {
    super(`The user object was not valid.\n${validationError}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.validationError = validationError;
  }
}
