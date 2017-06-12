import { Namespace, Routes } from './namespace';

//  ErrorResponse

//  http://jsonapi.org/format/#error-objects
export interface StandardErrorResponseBody {
  error: {
    id: string;
    message: string;
    summary?: string;
    errors?: Array<{
      source: string;
      reason: string;
    }>
  }
}

export class RootNamespace extends Namespace {
  constructor(children: Routes) {
    super('', {
      exceptionHandler: async function(error: Error) {
        const body: StandardErrorResponseBody = {
          error: {
            id: this.requestId,
            summary: 'Ooops something went wrong',
            message: error.message,
          }
        };

        console.log(`Error - ${this.requestId}\n${error.stack}`);

        return this.json(body, 500);
      },
      children
    })
  }
}