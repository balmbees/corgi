import * as LambdaProxy from './lambda-proxy';

import * as Joi from 'joi';

export type Parameters = { [key:string]: any };

// ---- RoutingContext
export class RoutingContext {
  public rawParams: Parameters;
  public validatedParams: Parameters;

  constructor(
    private request: LambdaProxy.Event,
    pathParams: { [key:string]: string }
  ) {
    this.rawParams = Object.assign({}, pathParams || {}, request.queryStringParameters || {});
    this.validatedParams = {};
  }

  get params() {
    return this.validatedParams;
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
