import * as pathToRegexp from 'path-to-regexp';
import * as _ from 'lodash';

import * as LambdaProxy from './lambda-proxy';
import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { RootNamespace } from './root-namespace';
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

  findMiddleware<T extends Middleware>(middlewareClass: MiddlewareConstructor<T>): T | undefined {
    return this.middlewareMap.get(middlewareClass as Function) as T | undefined;
  }

  findRoute(operationId: string) {
    return this.operationIdRouteMap[operationId] as Route | undefined;
  }

  handler() {
    return (event: LambdaProxy.Event, context: LambdaProxy.Context) => {
      const requestId = context.awsRequestId;
      const timeout = context.getRemainingTimeInMillis() * 0.9;
      this.resolve(
        event, { requestId, timeout }
      ).then((response) => {
        context.succeed(response);
      }, (error) => {
        context.succeed({
          statusCode: 500,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            error: {
              id: requestId,
              message: error.toString(),
            }
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


          const runRoute = async (namespaces: Namespace[], route: Route) => {
            try {
              // Run Parent Namespaces
              // This is for parameter and before, so Top -> Bottom
              for (const namespace of namespaces.slice().reverse()) {
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
              }

              // Run Route
              routingContext.validateAndUpdateParams(route.params || {});

              let timeoutHandle: NodeJS.Timer | undefined;
              const cleanTimeout = () => {
                if (timeoutHandle) {
                  clearTimeout(timeoutHandle);
                }
              };

              return await Promise.race([
                route.handler.call(routingContext),
                new Promise((resolve, reject) => {
                  timeoutHandle = setTimeout(() => {
                    reject(new TimeoutError(route));
                  }, router.routeTimeout || options.timeout);
                })
              ]).then((res) => {
                cleanTimeout();
                return Promise.resolve(res);
              }, (error) => {
                cleanTimeout();
                return Promise.reject(error);
              })
            } catch (e) {
              // This is exception handler, so Bottom -> Top.
              for (const namespace of namespaces) {
                if (namespace.exceptionHandler) {
                  const res = await namespace.exceptionHandler.call(routingContext, e);
                  if (res) {
                    return res;
                  } else {
                    // Pass it to next error handler
                  }
                }
              }
            }
          }
          const runMiddlewaresBefore = async (currentRoute: Route) => {
            for (const middleware of router.middlewares) {
              const metadata = currentRoute.getMetadata(middleware.constructor as any);
              const response = await middleware.before({ routingContext, currentRoute, metadata });
              if (response) {
                return response;
              }
            }
          }
          const runMiddlewaresAfter = async (currentRoute: Route, currentRouteResponse: LambdaProxy.Response) => {
            // Run after middlewares
            for (const middleware of router.middlewares.slice().reverse()) {
              const metadata = currentRoute.getMetadata(middleware.constructor as any);
              currentRouteResponse = await middleware.after({ routingContext, currentRoute, metadata, response: currentRouteResponse });
            }
            return currentRouteResponse;
          }

          const stepRoute = async function(
            prevRoutes: Array<Namespace>,
            currentRoute: Route | Namespace,
            nextRoutes: Routes
          ) : Promise<LambdaProxy.Response> {
            if (currentRoute instanceof Namespace) {
              const namespace = currentRoute;

              return await stepRoute(
                new Array(namespace, ...prevRoutes),
                nextRoutes[0],
                nextRoutes.slice(1)
              );
            } else {
              // Middleware Before
              const middlewareBeforeRes = await runMiddlewaresBefore(currentRoute);
              if (middlewareBeforeRes) { return middlewareBeforeRes }

              // Run actual Route
              const response = await runRoute(prevRoutes, currentRoute);

              // Middlewares After
              return await runMiddlewaresAfter(currentRoute, response);
            }
          }

          const res = await stepRoute([], flattenRoute[0], flattenRoute.slice(1));
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
