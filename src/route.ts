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

  // Simplified Constructors
  static GET(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'GET', descOrOptions, params, handler);
  }
  static PUT(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'PUT', descOrOptions, params, handler);
  }
  static POST(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'POST', descOrOptions, params, handler);
  }
  static DELETE(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'DELETE', descOrOptions, params, handler);
  }
  static OPTIONS(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'OPTIONS', descOrOptions, params, handler);
  }
  static HEAD(path: string, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    return this._factory(path, 'HEAD', descOrOptions, params, handler);
  }

  private static _factory(path: string, method: HttpMethod, descOrOptions: string | RouteSimplifiedOptions, params: ParameterDefinitionMap, handler: RouteHandler) {
    if (typeof descOrOptions === "string") {
      descOrOptions = { desc: descOrOptions };
    }
    return new this({ path, method, desc: descOrOptions.desc, operationId: descOrOptions.operationId, params, handler });
  }
}

export interface RouteSimplifiedOptions {
  desc?: string;
  operationId?: string;
}



export interface RouteOptions {
  path: string;
  method: HttpMethod;
  desc?: string;
  /**
   * Human readable operationId of given route
   */
  operationId?: string;
  params?: ParameterDefinitionMap;
  handler: RouteHandler;
}
