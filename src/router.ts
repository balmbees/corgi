import * as pathToRegexp from 'path-to-regexp';
import * as _ from 'lodash';

import * as LambdaProxy from './lambda-proxy';
import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { RootNamespace, StandardErrorResponseBody } from './root-namespace';
import { RoutingContext } from './routing-context';
import { ParameterInputType } from './parameter';
import { Middleware, MiddlewareConstructor } from './middleware';
import { TimeoutError } from '.';

// ---- Router

export function flattenRoutes(routes: Routes) {
  let flattenRoutes: Array<Routes> = [];
  routes.forEach(route => {
    flattenRoutes = [...flattenRoutes, ...flattenRoute([], route)];
  });
  return flattenRoutes;
}

export function flattenRoute(parents: Array<Route | Namespace>, route: Route | Namespace): Array<Routes> {
  if (route instanceof Route) {
    return [
      [
        ...parents,
        route
      ]
    ]
  } else {
    let routes: Array<Routes> = [];

    route.children.forEach((childRoute) => {
      const childRoutes = flattenRoute([...parents, route], childRoute);
      routes = [
        ...routes,
        ...childRoutes,
      ]
    });

    return routes;
  }
}

export class Router {
  private flattenRoutes: Array<Routes>;
  private operationIdRouteMap: { [operationId: string]: Route } = {};
  private middlewares: Middleware[];
  private middlewareMap = new Map<Function, Middleware>();
  private routeTimeout: number | undefined;

  constructor(routes: Routes, options: { timeout?: number, middlewares?: Middleware[] } = {}) {
    this.flattenRoutes = flattenRoutes([
      new RootNamespace(routes)
    ]);

    this.operationIdRouteMap =
      _.chain(this.flattenRoutes)
        .map(routes => _.last(routes) as Route)
        .filter(route => !!route.operationId)
        .groupBy(route => route.operationId)
        .mapValues((routes: Route[], operationId: string) => {
          if (routes.length > 1) {
            throw new Error(`route has duplicated operationId: "${operationId}"`)
          }
          return routes[0];
        })
        .value();

    this.middlewares = options.middlewares || [];

    this.middlewares.forEach(middleware => {
      if (this.middlewareMap.get(middleware.constructor)) {
        throw new Error(`Middleware<${middleware.constructor.name}> should be unique but not.`);
      }
      this.middlewareMap.set(middleware.constructor, middleware);
    });

    this.routeTimeout = options.timeout;
  }

  /**
   *
   * Timeout 을 error의 일종으로 처리할지
   * Error를 지금처럼 ExceptionHandler로 처리할지 Middleware에서 처리할수 있게 만들지
   * Timeout
   *
   */
  findMiddleware<T extends Middleware>(middlewareClass: MiddlewareConstructor<T>): T | undefined {
    return this.middlewareMap.get(middlewareClass as Function) as T | undefined;
  }

  findRoute(operationId: string) {
    return this.operationIdRouteMap[operationId] as Route | undefined;
  }

  handler() {
    return (event: LambdaProxy.Event, context: LambdaProxy.Context) => {
      this.resolve(
        event, {
          requestId: context.awsRequestId,
          timeout: context.getRemainingTimeInMillis() * 0.9,
        }
      ).then((response) => {
        context.succeed(response);
      }, (error) => {
        const converted = Object.getOwnPropertyNames(error)
          .reduce((hash, key) => {
            hash[key] = error[key];
            return hash;
          }, {} as { [key: string]: any });

        context.succeed({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            "error": { "message": `${JSON.stringify(converted)}` }
          }),
        });
      });
    };
  }

  async resolve(event: LambdaProxy.Event, options: { timeout: number, requestId?: string }): Promise<LambdaProxy.Response> {
    for (const flattenRoute of this.flattenRoutes) {
      const endRoute = (flattenRoute[flattenRoute.length - 1] as Route);
      const method = endRoute.method;

      // Matching Route
      if (method == event.httpMethod) {
        const joinedPath = flattenRoute.map(r => r.path).join('');
        const keys: pathToRegexp.Key[] = [];
        const regexp = pathToRegexp(joinedPath, keys);

        const match = regexp.exec(event.path);

        if (match) {
          const pathParams: { [key: string]: string } = {};
          keys.forEach((key, index) => {
            pathParams[key.name] = match[index + 1];
          });

          const routingContext = new RoutingContext(this, event, options.requestId, pathParams);
          const router = this;

          const stepRoute = async function(currentRoute: Route | Namespace, nextRoutes: Routes) : Promise<LambdaProxy.Response> {
            if (currentRoute instanceof Namespace) {
              const namespace = currentRoute;

              // Middleware, Or Just Next
              try {
                // Parameter Validation
                const params = _.mapValues(namespace.params, (schema, name) => {
                  return {
                    in: 'path' as ParameterInputType,
                    def: schema,
                  }
                });
                routingContext.validateAndUpdateParams(params);

                // Before Hook
                if (namespace.before) {
                  await namespace.before.call(routingContext);
                }
                return await stepRoute(nextRoutes[0], nextRoutes.slice(1));
              } catch (e) {
                if (namespace.exceptionHandler) {
                  const res = await namespace.exceptionHandler.call(routingContext, e);
                  if (!res) {
                    // Failed to handle error
                    throw e; // Just rethrow to parent handler
                  } else {
                    return res;
                  }
                } else {
                  throw e; // Just rethrow to parent handler
                }
              }
            } else {
              // Parameter Validation
              routingContext.validateAndUpdateParams(currentRoute.params || {});

              // Run before middlewares
              for (const middleware of router.middlewares) {
                const metadata = currentRoute.getMetadata(middleware.constructor as any);
                const response = await middleware.before({ routingContext, currentRoute, metadata });
                if (response) {
                  return response;
                }
              }

              // Actual Handler
              let timeoutHandle: NodeJS.Timer | undefined;
              const cleanTimeout = () => {
                if (timeoutHandle) {
                  clearTimeout(timeoutHandle);
                }
              };

              let response = await Promise.race([
                currentRoute.handler.call(routingContext),
                new Promise((resolve, reject) => {
                  timeoutHandle = setTimeout(() => {
                    reject(new TimeoutError(currentRoute));
                  }, router.routeTimeout || options.timeout);
                })
              ]).then((res) => {
                cleanTimeout();
                return Promise.resolve(res);
              }, (error) => {
                cleanTimeout();
                return Promise.reject(error);
              })

              // Run after middlewares
              for (const middleware of router.middlewares.slice().reverse()) {
                const metadata = currentRoute.getMetadata(middleware.constructor as any);
                response = await middleware.after({ routingContext, currentRoute, metadata, response });
              }
              return response;
            }
          }

          const res = await stepRoute(flattenRoute[0], flattenRoute.slice(1));
          return res;
        }
      }
    }

    // There isn't any route that handling this request
    return {
      statusCode: 404,
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({ error: 'Not Found' }),
    };
  }
}
