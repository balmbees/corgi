import * as LambdaProxy from './lambda-proxy';

import * as Joi from 'joi';

export type Parameters = { [key:string]: any };

//
const DefaultJoiValidateOptions = {
  stripUnknown: true,
  presence: 'required',
  abortEarly: false,
};

// ---- RoutingContext
export class RoutingContext {
  private rawParams: Parameters;
  private validatedParams: Parameters;

  constructor(
    private request: LambdaProxy.Event,
    pathParams: { [key:string]: string }
  ) {
    this.rawParams = Object.assign({}, pathParams || {}, request.queryStringParameters || {});
    this.validatedParams = {};
  }

  validateAndUpdateParams(schemaMap?: Joi.SchemaMap) {
    if (schemaMap) {
      const res = Joi.validate(
        this.rawParams,
        Joi.object().keys(schemaMap),
        DefaultJoiValidateOptions,
      );
      if (res.error) {
        throw res.error;
      } else {
        Object.assign(this.validatedParams, res.value);
      }
    }
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
