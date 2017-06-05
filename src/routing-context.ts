import * as LambdaProxy from './lambda-proxy';

// ---- RoutingContext
export class RoutingContext {
  private _params: { [key:string]: string };
  constructor(
    private request: LambdaProxy.Event,
    pathParams: { [key:string]: string }
  ) {
    this._params = Object.assign({}, pathParams || {}, request.queryStringParameters || {});
  }

  // Parameters
  get params(): { [key:string]: string } {
    return this._params;
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
