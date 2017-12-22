import { RoutingContext } from './routing-context';
import { Response } from './lambda-proxy';
import { Route } from './route';

export interface MiddlewareConstructor<MiddlewareClass extends Middleware> {
  readonly symbol: symbol;
  name: string;
  new(options: any): MiddlewareClass;
}

export abstract class Middleware<Metadata=undefined> {
  public get symbol(): symbol {
    if (!(this as any).constructor.__symbol) {
      return (this as any).constructor.__symbol = Symbol();
    }
    return (this as any).constructor.__symbol;
  }

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

class ABC extends Middleware<any>{
  constructor(a: { x: number }) {
    super({});
  }
}

function x<T extends Middleware<any>>(middlewareClass: MiddlewareConstructor<T>) {
  return {} as T;
}

const res = x(ABC);
