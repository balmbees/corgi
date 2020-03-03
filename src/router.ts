import * as _ from "lodash";
import * as pathToRegexp from "path-to-regexp";

import { TimeoutError } from ".";
import * as LambdaProxy from "./lambda-proxy";
import { Middleware, MiddlewareConstructor } from "./middleware";
import { Namespace, Routes } from "./namespace";
import { ParameterInputType } from "./parameter";
import { RootNamespace } from "./root-namespace";
import { Route } from "./route";
import { RoutingContext } from "./routing-context";

// ---- Router

export function flattenRoutes(routes: Routes) {
  let flattenedRoutes: Routes[] = [];
  routes.forEach(route => {
    flattenedRoutes = [...flattenedRoutes, ...flattenRoute([], route)];
  });
  return flattenedRoutes;
}

export function flattenRoute(parents: Array<Route | Namespace>, route: Route | Namespace): Routes[] {
  if (route instanceof Route) {
    return [
      [
        ...parents,
        route
      ]
    ];
  } else {
    let routes: Routes[] = [];

    route.children.forEach((childRoute) => {
      const childRoutes = flattenRoute([...parents, route], childRoute);
      routes = [
        ...routes,
        ...childRoutes,
      ];
    });

    return routes;
  }
}

export class Router {
  private flattenRoutes: Routes[];
  // operationId - Route Map
  private operations: Map<string, Route>;
  private middlewares: Middleware[];
  private middlewareMap = new Map<MiddlewareConstructor<any>, Middleware>();
  private routeTimeout: number | undefined;

  constructor(
    routes: Routes,
    options: { timeout?: number, middlewares?: Middleware[] } = {}
  ) {
    this.flattenRoutes = flattenRoutes([new RootNamespace(routes)]);

    this.operations = new Map(
      _.chain(this.flattenRoutes)
        .map(routesList => _.last(routesList) as Route)
        .filter(operation => !!operation.operationId)
        .groupBy(operation => operation.operationId)
        .mapValues((operations: Route[], operationId: string) => {
          if (operations.length > 1) {
            throw new Error(`${operations.length} Routes has duplicated operationId: "${operationId}"`);
          }
          return operations[0];
        })
        .toPairs()
        .value()
    );

    this.middlewares = options.middlewares || [];

    this.middlewares.forEach(middleware => {
      if (this.middlewareMap.get(middleware.constructor as any)) {
        throw new Error(`Middleware<${middleware.constructor.name}> should be unique but not.`);
      }
      this.middlewareMap.set(middleware.constructor as any, middleware);
    });

    this.routeTimeout = options.timeout;
  }

  public findMiddleware<T extends Middleware>(middlewareClass: MiddlewareConstructor<T>): T | undefined {
    return this.middlewareMap.get(middlewareClass) as T | undefined;
  }

  public findRoute(operationId: string) {
    return this.operations.get(operationId);
  }

  public handler() {
    return async (
      event: LambdaProxy.Event,
      context: LambdaProxy.Context
    ) => {
      context.callbackWaitsForEmptyEventLoop = false;

      const requestId = context.awsRequestId;
      const timeout = context.getRemainingTimeInMillis() * 0.9;
      try {
        return await this.resolve(event, { requestId, timeout });
      } catch (e) {
        // Now we're not gonna handle this "final" exception. this gonna just will be thrown into "lambda error"
      }
    };
  }

  // tslint:disable-next-line:member-ordering
  private readonly routeToPathRegexpCache = new Map<Route, { regexp: RegExp, keys: pathToRegexp.Key[] }>();

  public async resolve(
    event: LambdaProxy.Event, options: { timeout: number, requestId?: string }
  ): Promise<LambdaProxy.Response> {
    for (const routesList of this.flattenRoutes) {
      const endRoute = (routesList[routesList.length - 1] as Route);
      const method = endRoute.method;

      // Matching Route
      if (method === event.httpMethod) {
        const pathRegExp = (() => {
          let p = this.routeToPathRegexpCache.get(endRoute);
          if (!p) {
            const joinedPath = routesList.map(r => r.path).join("");
            const keys: pathToRegexp.Key[] = [];
            const regexp = pathToRegexp(joinedPath, keys);
            p = { keys, regexp };

            this.routeToPathRegexpCache.set(endRoute, p);
          }
          return p;
        })();

        const match = pathRegExp.regexp.exec(event.path);

        if (match) {
          const pathParams: { [key: string]: string } = {};
          pathRegExp.keys.forEach((key, index) => {
            pathParams[key.name] = match[index + 1];
          });

          const routingContext = new RoutingContext(this, event, options.requestId, pathParams);

          const prevRoutes: Namespace[] = [];
          for (const currentRoute of routesList) {
            if (currentRoute instanceof Namespace) {
              prevRoutes.splice(0, 0, currentRoute);
            } else {
              // Middleware Before
              const before = await (async () => {
                for (const middleware of this.middlewares) {
                  const metadata = currentRoute.getMetadata(middleware.constructor as any);
                  const middlewareResponse = await middleware.before({ routingContext, currentRoute, metadata });
                  if (middlewareResponse) {
                    return middlewareResponse;
                  }
                }
                return undefined;
              })();
              if (before) {
                return before;
              }

              // Run actual Route
              const response = await this.runRoute(
                routingContext, prevRoutes, currentRoute, options.timeout
              );

              // Middlewares After
              return await (async (currentRouteResponse: LambdaProxy.Response) => {
                // Run after middlewares
                for (const middleware of this.middlewares.slice().reverse()) {
                  const metadata = currentRoute.getMetadata(middleware.constructor as any);
                  currentRouteResponse = await middleware.after({
                    routingContext, currentRoute, metadata, response: currentRouteResponse
                  });
                }
                return currentRouteResponse;
              })(response);
            }
          }
        }
      }
    }

    // There isn't any route that handling this request
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: "Not Found" }),
    };
  }

  private async runRoute(
    routingContext: RoutingContext,
    namespaces: Namespace[],
    route: Route,
    timeout: number
  ) {
    try {
      // Run Parent Namespaces
      // This is for parameter and before, so Top -> Bottom
      for (const namespace of namespaces.slice().reverse()) {
        // Parameter Validation
        const params = _.mapValues(namespace.params, (schema, name) => {
          return {
            in: "path" as ParameterInputType,
            type: "joi" as const,
            def: schema,
          };
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
          }, this.routeTimeout || timeout);
        })
      ]).then((res) => {
        cleanTimeout();
        return Promise.resolve(res);
      }, (error) => {
        cleanTimeout();
        return Promise.reject(error);
      });
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
}
