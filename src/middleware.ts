import { RoutingContext } from './routing-context';
import { Response } from './lambda-proxy';
import { Route } from './route';

export abstract class Middleware {
  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  before?: (options: MiddlewareBeforeOptions) => Promise<Response | void>

  // runs after the application, should return response
  after?: (options: MiddlewareAfterOptions) => Promise<Response>;
}

export interface MiddlewareBeforeOptions {
  routingContext: RoutingContext;
  currentRoute: Route;
}

export interface MiddlewareAfterOptions {
  routingContext: RoutingContext;
  currentRoute: Route;
  response: Response;
}