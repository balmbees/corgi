import { RoutingContext } from './routing-context';
import { Response } from './lambda-proxy';
import { Route } from './route';

export interface MiddlewareConstructor<MiddlewareClass extends Middleware> {
  new(options: any): MiddlewareClass;
}

export class Middleware<Metadata=any> {
  constructor(options: {} = {}) {}

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  public async before(options: MiddlewareBeforeOptions<Metadata>): Promise<Response | void> {
  }

  // runs after the application, should return response
  public async after(options: MiddlewareAfterOptions<Metadata>): Promise<Response> {
    return options.response;
  }
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
