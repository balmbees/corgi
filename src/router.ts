import * as pathToRegexp from 'path-to-regexp';
import * as LambdaProxy from './lambda-proxy';
import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { RootNamespace, StandardErrorResponseBody } from './root-namespace';
import { RoutingContext } from './routing-context';
import { ParameterInputType } from './parameter';

import * as _ from 'lodash';

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

  constructor(routes: Routes) {
    this.flattenRoutes = flattenRoutes([
      new RootNamespace(routes)
    ]);
  }

  handler() {
    return (event: LambdaProxy.Event, context: LambdaProxy.Context) => {
      let timeoutHandle: NodeJS.Timer = null;

      Promise.race([
        this.resolve(event),
        new Promise<LambdaProxy.Response>((resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            const errorBody: StandardErrorResponseBody = {
              error: {
                id: event.requestContext.requestId,
                message: `Service timeout. ${JSON.stringify(event)}`,
              }
            }
            reject({
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
              body: JSON.stringify(errorBody),
            });
          }, context.getRemainingTimeInMillis() - 10)
        }),
      ]).then((response) => {
        clearTimeout(timeoutHandle);
        context.succeed(response);
      }, (error) => {
        clearTimeout(timeoutHandle);
        context.fail(error);
      });
    };
  }

  async resolve(event: LambdaProxy.Event): Promise<LambdaProxy.Response> {
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

          const routingContext = new RoutingContext(event, pathParams);

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
              } catch(e) {
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
            } else if (currentRoute instanceof Route) {
              // Parameter Validation
              routingContext.validateAndUpdateParams(currentRoute.params);

              // Actual Handler
              return await currentRoute.handler.call(routingContext);
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
