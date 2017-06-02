import * as LambdaProxy from './lambda-proxy';

// ---- RoutingContext
export class RoutingContext {
  constructor(
    private request: LambdaProxy.Event,
    private pathParams: { [key:string]: string }
  ) {}

  // Parameters
  get params(): { [key:string]: string } {
    return this.pathParams;
  }

  // Body Parser
  get bodyJSON(): any {
    return JSON.parse(this.request.body!);
  }

  // Response Helpers
  json(json: any, statusCode?: number): LambdaProxy.Response {
    return {
      statusCode: statusCode || 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(json),
    };
  }
}
