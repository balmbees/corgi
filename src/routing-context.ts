import * as Joi from "joi";
import * as _ from "lodash";
import * as qs from "qs";
import * as LambdaProxy from "./lambda-proxy";

import { ParameterDefinitionMap } from "./parameter";
import { Router } from "./router";

//
const DefaultJoiValidateOptions: Joi.ValidationOptions = {
  stripUnknown: true,
  presence: "required",
  abortEarly: false,
};

// ---- RoutingContext
export class RoutingContext {

  get headers(): LambdaProxy.EventHeaders {
    // normalize works lazily and should be cached for further use
    return this.normalizedHeaders
      || (this.normalizedHeaders = this.normalizeHeaders(this.request.headers));
  }

  get params() {
    return this.validatedParams;
  }

  // Body Parser
  get bodyJSON(): object | string | undefined {
    const body = this.request.isBase64Encoded ?
      Buffer.from(this.request.body as string, "base64").toString("utf8") :
      this.request.body;

    switch (this.headers["content-type"]) {
      case "application/x-www-form-urlencoded": {
        if (body) {
          return qs.parse(body);
        } else {
          return undefined;
        }
      }
      case "text": {
        return body;
      }
      case "application/json":
      default: {
        // default is json
        return body ? JSON.parse(body) : {};
      }
    }
  }
  private validatedParams: { [key: string]: any };
  private normalizedHeaders: { [key: string]: string } | null;

  constructor(
    public readonly router: Router,
    public readonly request: LambdaProxy.Event,
    public readonly requestId: string | undefined,
    private pathParams: { [key: string]: string }
  ) {
    this.validatedParams = {};
    this.normalizedHeaders = null;
  }

  public validateAndUpdateParams(parameterDefinitionMap: ParameterDefinitionMap) {
    const groupByIn: {
      [key: string]: { [key: string]: Joi.Schema }
    } = {};

    _.forEach(parameterDefinitionMap, (schema, name) => {
      if (!groupByIn[schema.in]) {
        groupByIn[schema.in] = {};
      }

      groupByIn[schema.in][name] = schema.def;
    });

    const validate = (rawParams: any, schemaMap: { [key: string]: Joi.Schema }) => {
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
    };

    if (groupByIn.path) {
      validate(this.decodeURI(this.pathParams), groupByIn.path);
    }
    if (groupByIn.query) {
      // API Gateway only support string parsing.
      // but with this, now it would support Array<String> / Map<String, String> parsing too
      const queryStringParameters = qs.parse(qs.stringify(this.request.queryStringParameters));
      validate(this.decodeURI(queryStringParameters), groupByIn.query);
    }
    if (groupByIn.body) {
      validate(this.bodyJSON, groupByIn.body);
    }
  }

  // Response Helpers
  public json(
    json: any,
    statusCode: number = 200,
    headers: LambdaProxy.EventHeaders = {}
  ): LambdaProxy.Response {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...headers,
      },
      body: JSON.stringify(json),
    };
  }

  private decodeURI(object: { [key: string]: any }) {
    return _.mapValues(object, (value, key) => {
      if (typeof value === "string") {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      } else {
        return value;
      }
    });
  }

  // Helper for normalizing request headers
  private normalizeHeaders(headers: LambdaProxy.EventHeaders = {}) {
    return Object.keys(headers).reduce((hash, key) => {
      hash[key.toLowerCase()] = headers[key];

      return hash;
    }, Object.create(null));
  }
}
