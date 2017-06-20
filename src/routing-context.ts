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
    public readonly request: LambdaProxy.Event,
    private pathParams: { [key:string]: string }
  ) {
    this.validatedParams = {};
    this.normalizedHeaders = null;
  }

  get requestId() {
    return this.request.requestContext.requestId;
  }

  private decodeURI(object: { [key: string]: any }) {
    return _.mapValues(object, (value, key) => {
      if (typeof value === 'string') {
        return decodeURIComponent(value);
      } else {
        return value;
      }
    });
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

    const _validate = (rawParams: any, schemaMap: { [key: string]: Joi.Schema }) => {
      const res = Joi.validate(
        rawParams || {},
        Joi.object(schemaMap),
        DefaultJoiValidateOptions,
      );

      if (res.error) {
        throw res.error;
      } else {
        Object.assign(this.validatedParams, res.value);
      }
    }

    if (groupByIn['path']) {
      _validate(this.decodeURI(this.pathParams), groupByIn['path']);
    }
    if (groupByIn['query']) {
      _validate(this.decodeURI(this.request.queryStringParameters), groupByIn['query']);
    }
    if (groupByIn['body']) {
      _validate(this.bodyJSON, groupByIn['body']);
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
