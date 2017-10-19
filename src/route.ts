import * as LambdaProxy from './lambda-proxy';
import { RoutingContext } from './routing-context';
import { ParameterDefinitionMap } from './parameter';

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
export type RouteHandler = (this: RoutingContext) => Promise<LambdaProxy.Response>;

// ---- Route
export class Route {
  constructor(private options: RouteOptions) {}

  get path() { return this.options.path; }
  get method() { return this.options.method; }
  get desc() { return this.options.desc; }
  get handler() { return this.options.handler; }
  get params() { return this.options.params; }
  get operationId() { return this.options.operationId; }

  public getMiddlewareMetadata<MiddlewareMetadata>(middlewareClass: any) : MiddlewareMetadata | undefined {
    return this.options.middlewareMetadata && this.options.middlewareMetadata[middlewareClass];
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
      operationId: options.operationId,
      middlewareMetadata: options.middlewares || {},
      params,
      handler
    });
  }
}

export interface RouteSimplifiedOptions {
  desc?: string;
  operationId: string;
  middlewares?: {
    [middlewareClass: string]: any;
  };
}

export interface RouteOptions {
  path: string;
  method: HttpMethod;
  desc?: string;
  /**
   * Human readable operationId of given route
   */
  operationId?: string;
  middlewareMetadata?: {
    [middlewareClass: string]: any;
  };

  params?: ParameterDefinitionMap;
  handler: RouteHandler;
}
