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
  private normalizedHeaders: { [key: string]: string };

  constructor(
    private request: LambdaProxy.Event,
    private pathParams: { [key:string]: string }
  ) {
    this.validatedParams = {};
    this.normalizedHeaders = null;
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

  get headers(): LambdaProxy.EventHeaders {
    // normalize works lazily and should be cached for further use
    return this.normalizedHeaders
      || (this.normalizedHeaders = this.normalizeHeaders(this.request.headers));
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
  json(
    json: any,
    statusCode: number = 200,
    headers: LambdaProxy.EventHeaders = {}
  ): LambdaProxy.Response {
    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      },
      body: JSON.stringify(json),
    };
  }

  // Helper for normalizing request headers
  private normalizeHeaders(headers: LambdaProxy.EventHeaders = {}) {
    return Object.keys(headers).reduce((hash, key) => {
      hash[key.toLowerCase()] = headers[key];

      return hash;
    }, Object.create(null));
  }
}
