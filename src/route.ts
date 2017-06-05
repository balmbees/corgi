import * as LambdaProxy from './lambda-proxy';
import { RoutingContext } from './routing-context';
import * as Joi from 'joi';

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

  // Simplified Constructors
  static GET(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'GET', desc, params, handler);
  }
  static PUT(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'PUT', desc, params, handler);
  }
  static POST(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'POST', desc, params, handler);
  }
  static DELETE(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'DELETE', desc, params, handler);
  }
  static OPTIONS(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'OPTIONS', desc, params, handler);
  }
  static HEAD(path: string, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return this._factory(path, 'HEAD', desc, params, handler);
  }

  private static _factory(path: string, method: HttpMethod, desc: string, params: Joi.SchemaMap, handler: RouteHandler) {
    return new this({ path, method, desc, params, handler });
  }

  validateParams(params: { [key: string]: string }) {
    return Joi.validate(
      params,
      Joi.object().keys(this.params),
      { stripUnknown: true },
    );
  }
}

export interface RouteOptions {
  path: string;
  method: HttpMethod;
  desc: string;
  params?: Joi.SchemaMap;
  handler: RouteHandler;
}
