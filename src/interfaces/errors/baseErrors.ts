/**
 * The base class for any errors raised by the Sengi system.
 */
export class SengiError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for errors working with the document store.
 */
export class SengiDocStoreError extends SengiError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for errors raised within the engine.  These are
 * primarily caused by errors in the configuration of document types.
 */
export class SengiEngineError extends SengiError {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}

/**
 * Base class for errors raised in response to invalid requests.
 */
export class SengiRequestError extends SengiError { // HTTP 400
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
  }
}
