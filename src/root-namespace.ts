import { Namespace, Routes } from './namespace';
import { StandardErrorResponseBody } from "./error_response";

export class StandardError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly options: {
      code: string,
      message: string,
      metadata?: object,
    }
  ) {
    super()
  }
}

export class RootNamespace extends Namespace {
  constructor(children: Routes) {
    super('', {
      async exceptionHandler(error: Error) {
        if (error instanceof StandardError) {
          return this.json({
            error: {
              id: this.requestId,
              code: error.options.code,
              message: error.options.message,
              metadata: error.options.metadata,
            }
          } as StandardErrorResponseBody, error.statusCode);
        } else {
          return this.json({
            error: {
              id: this.requestId,
              code: error.name,
              message: error.message,
            }
          } as StandardErrorResponseBody, 500);
        }
      },
      children
    })
  }
}