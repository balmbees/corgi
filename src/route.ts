import * as LambdaProxy from './lambda-proxy';
import { RoutingContext } from './routing-context';

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE';
export type RouteHandler = (this: RoutingContext) => Promise<LambdaProxy.Response>;

// ---- Route
export class Route {
  private _path: string;
  private _method: string;
  private _handler: RouteHandler;
  private _description: string;

  constructor(
    path: string,
    method: HttpMethod,
    description: string,
    handler: RouteHandler
  ) {
    this._path = path;
    this._method = method;
    this._description = description;
    this._handler = handler;
  }

  get path() { return this._path; }
  get method() { return this._method; }
  get description() { return this._description; }
  get handler() { return this._handler; }
}

export class ParameterValidator {
}
