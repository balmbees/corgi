import { Namespace, Routes } from './namespace';

//  ErrorResponse

//  http://jsonapi.org/format/#error-objects
export interface StandardErrorResponseBody {
  errors: Array<{
    id: string;
    message: string;
    code?: number;
  }>;
}

export class RootNamespace extends Namespace {
  constructor(children: Routes) {
    super('', {
      exceptionHandler: async function(error: Error) {
        const body: StandardErrorResponseBody = {
          errors: [{
            id: this.requestId,
            message: error.message,
          }]
        };

        console.log(`Error - ${this.requestId}\n${error.stack}`);

        return this.json(body, 500);
      },
      children
    })
  }
}