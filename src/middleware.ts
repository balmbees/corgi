import { RoutingContext } from './routing-context';
import { Response } from './lambda-proxy';
import { Route } from './route';

export abstract class Middleware<Metadata=undefined> {
  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  before?: (options: MiddlewareBeforeOptions<Metadata>) => Promise<Response | void>

  // runs after the application, should return response
  after?: (options: MiddlewareAfterOptions<Metadata>) => Promise<Response>;
}

export interface MiddlewareBeforeOptions<Metadata> {
  routingContext: RoutingContext;

  currentRoute: Route;
  metadata?: Metadata;
}

export interface MiddlewareAfterOptions<Metadata> {
  routingContext: RoutingContext;
  currentRoute: Route;
  metadata?: Metadata;
  response: Response;
}