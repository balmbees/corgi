import * as Joi from "joi";
import * as _ from "lodash";
import * as qs from "qs";
import * as LambdaProxy from "./lambda-proxy";

import { ParameterDefinitionMap } from "./parameter";
import { Router } from "./router";

import * as JSONSchema from "jsonschema";

//
const DefaultJoiValidateOptions: Joi.ValidationOptions = {
  stripUnknown: true,
  presence: "required",
  abortEarly: false,
};

export class ParameterValidationError extends Error {
  constructor(
    public parameterName: string,
    errorMessage: string
  ) {
    super(`${parameterName} ${errorMessage}`);
  }
}

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
    const paramsByIn = _.chain(parameterDefinitionMap)
      .toPairs()
      .map(([name, def]) => {
        return { name, def };
      })
      .groupBy(({ def }) => {
        switch (def.type) {
          case "joi": {
            return def.in;
          }
          case "open-api": {
            return def.schema.in;
          }
        }
      })
      .mapValues(group => {
        return _.fromPairs(group.map(v => [v.name, v.def]));
      })
      .value();

    const validate = (rawParams: any, schemaMap: ParameterDefinitionMap) => {
      if (_.size(schemaMap) === 0) {
        return;
      } else {
        // Validate Joi
        const joiParams = _.chain(schemaMap)
          .map((def, name) => {
            if (def.type === "joi") {
              return [name, def.def] as const;
            }
          })
          .compact()
          .fromPairs()
          .value();
        const res = Joi.validate(
          rawParams || {},
          Joi.object(joiParams),
          DefaultJoiValidateOptions,
        );
        if (res.error) {
          throw res.error;
        } else {
          Object.assign(this.validatedParams, res.value);
        }

        // Validate OpenAPI
        _.forEach(schemaMap, (def, name) => {
          if (def.type === "open-api") {
            try {
              // one fucking exception, sending "number" as string on query string, since querystring is always string.
              let rawValue = rawParams[name];
              if (def.schema.in === "query") {
                if (def.schema.schema!.type === "number") {
                  rawValue = Number(rawValue); // string -> number
                } else if (
                  def.schema.schema!.type === "object"
                  || def.schema.schema!.type === "array"
                ) {
                  if (rawValue) {
                    try {
                      rawValue = JSON.parse(rawValue);
                    } catch (e) {
                      // if it's just wrongly typed JSON -
                      rawValue = undefined;
                    }
                  }
                }
              }

              const result = JSONSchema.validate(rawValue, def.schema.schema, { throwError: true });
              this.validatedParams[name] = result.instance;
            } catch (e) {
              const error = e as JSONSchema.ValidationError;
              throw new ParameterValidationError(name, error.message);
            }
          }
        });
      }
    };

    if (paramsByIn.path) {
      validate(this.decodeURI(this.pathParams), paramsByIn.path);
    }
    if (paramsByIn.query) {
      // API Gateway only support string parsing.
      // but with this, now it would support Array<String> / Map<String, String> parsing too
      const queryStringParameters = qs.parse(qs.stringify(this.request.queryStringParameters));
      validate(queryStringParameters, paramsByIn.query);
    }
    if (paramsByIn.body) {
      validate(this.bodyJSON, paramsByIn.body);
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
