import * as LambdaProxy from './lambda-proxy';
import * as Joi from 'joi';
import * as _ from 'lodash';

import { ParameterDefinitionMap } from './parameter';

//
const DefaultJoiValidateOptions = {
  stripUnknown: true,
  presence: 'required',
  abortEarly: false,
};

// ---- RoutingContext
export class RoutingContext {
  private validatedParams: { [key:string]: any };

  constructor(
    private request: LambdaProxy.Event,
    private pathParams: { [key:string]: string }
  ) {
    this.validatedParams = {};
  }

  validateAndUpdateParams(parameterDefinitionMap: ParameterDefinitionMap) {
    const groupByIn: {
      [key: string]: { [key: string]: Joi.Schema }
    } = {};

    _.forEach(parameterDefinitionMap, (schema, name) => {
      if (!groupByIn[schema.in])
        groupByIn[schema.in] = {};

      groupByIn[schema.in][name] = schema.def;
    });

    // Path Params
    if (groupByIn['path']) {
      const res = Joi.validate(
        this.pathParams,
        Joi.object(groupByIn['path']),
        DefaultJoiValidateOptions,
      );
      if (res.error) {
        throw res.error;
      } else {
        Object.assign(this.validatedParams, res.value);
      }
    }

    // Query Params
    if (groupByIn['query']) {
      const res = Joi.validate(
        this.request.queryStringParameters || {},
        Joi.object(groupByIn['query']),
        DefaultJoiValidateOptions,
      );
      if (res.error) {
        throw res.error;
      } else {
        Object.assign(this.validatedParams, res.value);
      }
    }

    // Body Params
    if (groupByIn['body']) {
      const res = Joi.validate(
        this.bodyJSON,
        Joi.object(groupByIn['body']),
        DefaultJoiValidateOptions
      );
      if (res.error) {
        throw res.error;
      } else {
        Object.assign(this.validatedParams, res.value);
      }
    };
  }

  get params() {
    return this.validatedParams;
  }

  // Body Parser
  get bodyJSON(): any {
    // TODO Check Header Content-Type
    return JSON.parse(this.request.body);
  }

  // Response Helpers
  json(json: any, statusCode?: number): LambdaProxy.Response {
    return {
      statusCode: statusCode || 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(json),
    };
  }
}
