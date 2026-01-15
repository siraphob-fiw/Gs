// Results class moved from human-lift-training-api/src/Helpers/Commons.ts

/**
 * Generic Results class for consistent API responses
 */
export class Results<T> {
  private _returnValue: T | null = null;

  public static readonly CODE_OK: number = 0;
  public static readonly CODE_ERROR: number = 1001;
  public static readonly CODE_FAIL: number = 1002;
  public static readonly CODE_WARNING: number = 1003;
  public static readonly CODE_INVALID_ARGUMENT: number = 1004;
  public static readonly CODE_VALIDATION_FAILED: number = 1005;
  public static readonly CODE_DATA_NOT_FOUND: number = 1006;

  constructor(private _code: number, private _message?: string) {}

  public static ok<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_OK, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public static error<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_ERROR, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public static fail<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_FAIL, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public static warning<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_WARNING, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public static invalidArgs<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_INVALID_ARGUMENT, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public static validationError<T>(returnValue?: T | null, message?: string): Results<T> {
    const results = new Results<T>(Results.CODE_VALIDATION_FAILED, message);
    if (returnValue !== undefined) {
      results.setReturnValue(returnValue);
    }
    return results;
  }

  public get resultCode(): number {
    return this._code;
  }

  public withResultCode(code: number): Results<T> {
    this._code = code;
    return this;
  }

  public get isOk(): boolean {
    return this._code === Results.CODE_OK;
  }

  public get message(): string | null | undefined {
    return this._message;
  }

  public get returnValue(): T | null | undefined {
    if (this._returnValue !== undefined) {
      return this._returnValue;
    }
    return undefined;
  }

  public setReturnValue(returnVal: T | null): Results<T> {
    this._returnValue = returnVal;
    return this;
  }
}