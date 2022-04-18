import { SengiDocStoreError } from "./baseErrors.ts";

/**
 * An error raised if the doc store does not have a required function.
 */
export class MissingDocStoreFunctionError extends SengiDocStoreError {
  /**
   * Constructs a new instance.
   * @param functionName The name of the missing function.
   */
  constructor(readonly functionName: string) {
    super(`Doc store does not provide '${functionName}' function.`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.functionName = functionName;
  }
}

/**
 * An error that is raised if the underlying document store
 * throws an error while trying to complete a function.
 */
export class UnexpectedDocStoreError extends SengiDocStoreError {
  /**
   * Constructs a new instance.
   * @param functionName The name of the function that throw an error.
   * @param innerErr The original error message.
   */
  constructor(readonly functionName: string, readonly innerErr: Error) {
    super(
      `Doc store raised an error while completing '${functionName}' operation.\n${innerErr.toString()}`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.functionName = functionName;
    this.innerErr = innerErr;
  }
}
