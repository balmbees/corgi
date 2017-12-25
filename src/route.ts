import * as _ from "lodash";
import * as Joi from "joi";

import * as LambdaProxy from './lambda-proxy';
import { RoutingContext } from './routing-context';
import { ParameterDefinitionMap } from './parameter';

import { MiddlewareConstructor, Middleware } from "./middleware";

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type RouteHandler = (this: RoutingContext) => Promise<LambdaProxy.Response>;

// ---- Route
export class Route {
  public readonly path: string;
  public readonly method: HttpMethod;
  public readonly description: string | undefined;
  public readonly handler: RouteHandler;
  public readonly params: ParameterDefinitionMap | undefined;
  public readonly operationId: string | undefined;
  public readonly responses: Map<number, ResponseSchema> | undefined;
  public readonly metadata: Map<Function, any>;

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
    this.metadata = options.metadata || new Map<Function, any>();
  }

  public getMetadata<Metadata>(klass: MiddlewareConstructor<Middleware<Metadata>>) : Metadata | undefined {
    return this.metadata.get(klass);
  }

  // Simplified Constructors
  static GET(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'GET', options, params, handler);
  }
  static PUT(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'PUT', options, params, handler);
  }
  static POST(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'POST', options, params, handler);
  }
  static DELETE(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'DELETE', options, params, handler);
  }
  static OPTIONS(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'OPTIONS', options, params, handler);
  }
  static HEAD(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'HEAD', options, params, handler);
  }

  private static _factory(path: string, method: HttpMethod, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
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
}

export interface RouteSimplifiedOptions {
  desc?: string;
  operationId?: string;
  responses?: { [statusCode: number]: ResponseSchema };
  metadata?: Map<Function, any>;
}

export interface RouteOptions {
  path: string;
  method: HttpMethod;
  desc?: string;
  operationId?: string;
  responses?: { [statusCode: number]: ResponseSchema };
  metadata?: Map<Function, any>;
  params?: ParameterDefinitionMap;
  handler: RouteHandler;
}

export interface ResponseSchemaEntity {
  name: string;
  schema: Joi.Schema;
}

export interface ResponseSchema {
  desc?: string;
  schema?: Joi.Schema;
}
