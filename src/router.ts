import * as pathToRegexp from 'path-to-regexp';
import * as LambdaProxy from './lambda-proxy';
import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { RoutingContext } from './routing-context';

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
    this.flattenRoutes = flattenRoutes(routes);
  }

  handler() {
    return (event: LambdaProxy.Event, context: LambdaProxy.Context) => {
      this.resolve(event).then((response) => {
        context.succeed(response);
      }, (error) => {
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
                routingContext.validateAndUpdateParams(namespace.params);

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