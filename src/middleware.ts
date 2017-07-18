import { RoutingContext } from './routing-context';
import { Response } from './lambda-proxy';

export interface Middleware {
  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  before?: (routingContext: RoutingContext) => Promise<Response | void>

  // runs after the application, should return response
  after?: (routingContext: RoutingContext, response: Response) => Promise<Response>;
}
