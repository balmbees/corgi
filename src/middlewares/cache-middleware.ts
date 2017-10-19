import { Middleware, MiddlewareBeforeOptions, MiddlewareAfterOptions } from '../middleware';
import { RoutingContext } from '../routing-context';
import { Response } from '../lambda-proxy';
import { Route } from "../route";

export interface CacheStore {
  get(key: string): Promise<string>;
  set(key: string, value: string, expiresIn: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export class CacheMiddlewareMetadata {
  /**
   * in second
   */
  constructor(public expiresIn: number) {

  }
}

export class CacheMiddleware implements Middleware {
  constructor(private store: CacheStore) {}

  cacheKey(operationId: string, params: any) {
    return `${operationId}.${JSON.stringify(params)}`;
  }

  async deleteCache(operationId: string, params: any) {
    return await this.store.delete(this.cacheKey(operationId, params))
  }

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  async before(options: MiddlewareBeforeOptions): Promise<Response | void> {
    const { currentRoute, routingContext } = options;

    // if the route is ready for cache
    const metadata = currentRoute.getMiddlewareMetadata<CacheMiddlewareMetadata>('cache');
    if (metadata) {
      const operationId = currentRoute.operationId;
      if (!operationId) {
        throw new Error("CacheMiddleware requires route to must have operationId");
      }
      if (currentRoute.method !== 'GET') {
        throw new Error("CacheMiddleware requires route to must be GET");
      }

      const cacheKey = this.cacheKey(operationId, routingContext.params);
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
    const { currentRoute, routingContext, response } = options;

    const metadata = currentRoute.getMiddlewareMetadata<CacheMiddlewareMetadata>('cache');
    if (metadata) {
      // this already get checked from before anyway
      const operationId = currentRoute.operationId!;
      const cacheKey = this.cacheKey(operationId, routingContext.params);

      await this.store.set(cacheKey, JSON.stringify(response), metadata.expiresIn);
    }
    return response;
  }
}