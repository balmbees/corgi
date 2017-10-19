import { Middleware, MiddlewareBeforeOptions, MiddlewareAfterOptions } from '../middleware';
import { RoutingContext } from '../routing-context';
import { Response } from '../lambda-proxy';
import { Route } from "../route";

export interface CacheStore {
  get(key: string): Promise<string>;
  set(key: string, value: string, expiresIn: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface CacheMiddlewareMetadata {
  /**
   * in second
   */
  expiresIn: number;
}

export class CacheMiddleware implements Middleware {
  constructor(private store: CacheStore) {}

  cacheKey(routingContext: RoutingContext) {
    return [
      routingContext.request.httpMethod,
      routingContext.request.path,
      routingContext.request.queryStringParameters,
    ].join("-");
  }

  async deleteCache(route: Route) {
    return await this.store.delete(
      `${route.method} `
    );
  }

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  async before(options: MiddlewareBeforeOptions): Promise<Response | void> {
    // if the route is ready for cache
    const metadata = options.currentRoute.getMiddlewareMetadata<CacheMiddlewareMetadata>(CacheMiddleware);
    if (metadata) {
      const cacheKey = this.cacheKey(options.routingContext);
      const cachedRes = await this.store.get(cacheKey);
      if (cachedRes) {
        // and there is a cache
        return JSON.parse(cachedRes) as Response;
      }
    }
    return undefined;
  }

  // runs after the application, should return response
  async after(options: MiddlewareAfterOptions): Promise<Response> {
    const metadata = options.currentRoute.getMiddlewareMetadata<CacheMiddlewareMetadata>(CacheMiddleware);
    if (metadata) {
      const cacheKey = this.cacheKey(options.routingContext);
      await this.store.set(cacheKey, JSON.stringify(options.response), metadata.expiresIn);
    }
    return options.response;
  }
}