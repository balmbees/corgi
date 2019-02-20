import * as Joi from "joi";
import * as _ from "lodash";

import * as LambdaProxy from "./lambda-proxy";
import { ParameterDefinitionMap } from "./parameter";
import { RoutingContext } from "./routing-context";

import { Middleware, MiddlewareConstructor } from "./middleware";

export type HttpMethod = "GET" | "PUT" | "POST" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export type RouteHandler = (this: RoutingContext) => Promise<LambdaProxy.Response>;
export type RouteMetadata = Map<Function, any>; // tslint:disable-line

// ---- Route
export class Route {

  // Simplified Constructors
  // tslint:disable:max-line-length
  public static GET(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "GET", options, params, handler);
  }
  public static PUT(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "PUT", options, params, handler);
  }
  public static POST(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "POST", options, params, handler);
  }
  public static PATCH(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "PATCH", options, params, handler);
  }
  public static DELETE(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "DELETE", options, params, handler);
  }
  public static OPTIONS(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "OPTIONS", options, params, handler);
  }
  public static HEAD(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, "HEAD", options, params, handler);
  }
  // tslint:enable:max-line-length

  private static _factory(
    path: string,
    method: HttpMethod,
    options: RouteSimplifiedOptions,
    params: ParameterDefinitionMap,
    handler: RouteHandler
  ) {
    return new this({
      path,
      method,
      desc: options.desc,
      responses: options.responses,
      operationId: options.operationId,
      metadata: options.metadata,
      params,
      handler
    });
  }
  public readonly path: string;
  public readonly method: HttpMethod;
  public readonly description: string | undefined;
  public readonly handler: RouteHandler;
  public readonly params: ParameterDefinitionMap | undefined;
  public readonly operationId: string;
  public readonly responses: Map<number, ResponseSchema> | undefined;
  public readonly metadata: RouteMetadata;

  constructor(options: RouteOptions) {
    this.path = options.path;
    this.method = options.method;
    this.description = options.desc;
    this.handler = options.handler;
    this.params = options.params;
    this.operationId = options.operationId;
    this.responses = options.responses ? new Map(
      _.toPairs(options.responses || {})
       .map(pair => [Number(pair[0]), pair[1]] as [number, ResponseSchema])
    ) : undefined;
    this.metadata = options.metadata || new Map();
  }

  public getMetadata<Metadata>(klass: MiddlewareConstructor<Middleware<Metadata>>): Metadata | undefined {
    return this.metadata.get(klass);
  }
}

export interface RouteSimplifiedOptions {
  desc?: string;
  operationId: string;
  responses?: { [statusCode: number]: ResponseSchema };
  metadata?: RouteMetadata;
}

export interface RouteOptions {
  path: string;
  method: HttpMethod;
  desc?: string;
  operationId: string;
  responses?: { [statusCode: number]: ResponseSchema };
  metadata?: RouteMetadata;
  params?: ParameterDefinitionMap;
  handler: RouteHandler;
}

export interface ResponseSchemaEntity {
  name: string;
  schema: Joi.Schema;
}

export interface ResponseSchema {
  desc?: string;
  schema?: Joi.Schema | JSONSchema;
}

/**
 *  Actual JSON Schema in JSON representation
 */
export type JSONSchema = object;
