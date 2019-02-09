import {
  ErrorResponseFormatter, StandardError,
  StandardErrorResponseBody,
} from "./error_response";
import { Namespace, Routes } from "./namespace";

export class RootNamespace extends Namespace {
  public readonly errorFormatter: ErrorResponseFormatter;

  constructor(children: Routes) {
    const errorFormatter = new ErrorResponseFormatter(process.env.CORGI_ERROR_PASSSWORD);

    super("", {
      async exceptionHandler(error: Error) {
        if (error instanceof StandardError) {
          return this.json({
            error: {
              id: this.requestId,
              ...errorFormatter.format(error),
            }
          } as StandardErrorResponseBody, error.statusCode);
        } else {
          // For Non-Standard error,
          return this.json({
            error: {
              id: this.requestId,
              ...errorFormatter.format(error),
            }
          } as StandardErrorResponseBody, 500);
        }
      },
      children
    });

    this.errorFormatter = errorFormatter;
  }
}
