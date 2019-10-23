import JoiToJSONSchema = require("@vingle/joi-to-json-schema");
import * as _ from "lodash";
import * as OpenApi from "openapi3-ts";

import * as LambdaProxy from "../lambda-proxy";

import { Namespace, Routes } from "../namespace";
import { JSONSchema, Route} from "../route";

import { flattenRoutes } from "../router";

export type OpenAPIRouteOptions = (
  // OpenAPI.Info &
  { title: string, version: string } &
  { definitions?: { [definitionsName: string]: JSONSchema } }
);

function deepOmit(obj: any, keysToOmit: string[]) {
  const keysToOmitIndex = _.keyBy(keysToOmit); // create an index object of the keys that should be omitted

  const omitFromObject = (objectToOmit: any) => {
    // the inner function which will be called recursively
    return _.transform(objectToOmit, function(result: any, value, key) { // transform to a new object
      if (key in keysToOmitIndex) { // if the key is in the index skip it
        return;
      }

      // if the key is an object run it through the inner function - omitFromObject
      result[key] = _.isObject(value) ? omitFromObject(value) : value;
    });
  };

  return omitFromObject(obj); // return the inner function result
}

function convertJoiToJSONSchema(joi: any) {
  return deepOmit(JoiToJSONSchema(joi), ["additionalProperties", "patterns"]);
}

export class OpenAPIRoute extends Namespace {
  constructor(
    path: string,
    info: OpenAPIRouteOptions,
    routes: Routes
  ) {

    const CorsHeaders = function(origin: string) {
      return {
        "Access-Control-Allow-Origin": origin || "",
        "Access-Control-Allow-Headers": [
          "Content-Type",
        ].join(", "),
        "Access-Control-Allow-Methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].join(", "),
        "Access-Control-Max-Age": `${60 * 60 * 24 * 30}`,
      };
    };

    super(path, {
      children: [
        Route.OPTIONS(
          "/", { desc: "CORS Preflight Endpoint for OpenAPI Documentation API", operationId: "optionOpenAPI" }, {},
          async function() {
            return this.json("", 204, CorsHeaders(this.headers.origin));
          }),

        Route.GET("/", { desc: "OpenAPI Documentation API", operationId: "getOpenAPI" }, {},
          async function() {
            const docGenerator = new OpenAPIGenerator();
            const json = docGenerator.generateJSON(info, this.request, routes);
            return this.json(json, 200, CorsHeaders(this.headers.origin));
          }),
      ],
    });
  }
}

export class OpenAPIGenerator {
  constructor() {
    //
  }

  public generateJSON(
    info: OpenAPIRouteOptions,
    request: LambdaProxy.Event,
    cascadedRoutes: Routes
  ) {
    const paths: OpenApi.PathsObject = {};

    flattenRoutes(cascadedRoutes).forEach((routes) => {
      const endRoute = (routes[routes.length - 1] as Route);
      const corgiPath = routes.map(r => r.path).join("");
      const OpenAPIPath = this.toOpenAPIPath(corgiPath);

      if (!paths[OpenAPIPath]) {
        paths[OpenAPIPath] = {};
      }

      paths[OpenAPIPath][(() => {
        switch (endRoute.method) {
          case "GET": return "get" as const;
          case "PUT": return "put" as const;
          case "POST": return "post" as const;
          case "PATCH": return "patch" as const;
          case "DELETE": return "delete" as const;
          case "OPTIONS": return "options" as const;
          case "HEAD": return "head" as const;
        }
      })()] = (() => {
        const operation: OpenApi.OperationObject = {
          description: endRoute.description,
          operationId: endRoute.operationId,
          parameters:
            _.flatMap(routes, (route): OpenApi.ParameterObject[] => {
              if (route instanceof Namespace) {
                // Namespace only supports path
                return _.map(route.params, (schema, name) => {
                  return {
                    in: "path",
                    name,
                    description: schema.describe().description,
                    schema: {
                      type: convertJoiToJSONSchema(schema).type,
                    },
                    required: true
                  };
                });
              } else {
                return _.chain(route.params)
                  .toPairs()
                  .filter(r => r[1].in !== "body")
                  .map(([name, def]) => {
                    const { description, flags } = def.def.describe();

                    return {
                      in: def.in as "query",
                      name,
                      description,
                      schema: convertJoiToJSONSchema(def.def),
                      required: def.in === "path"
                        || ((flags || {}) as any).presence !== "optional",
                    };
                  })
                  .value();
              }
            }),
          requestBody: (() => {
            const bodyParams = _.chain(routes)
              .flatMap((route) => {
                if (route instanceof Namespace) {
                  return [];
                } else {
                  return _.chain(route.params)
                    .toPairs()
                    .filter(r => r[1].in === "body")
                    .value();
                }
              })
              .map(
                ([name, paramDef]) =>
                  ([name, convertJoiToJSONSchema(paramDef.def)])
              )
              .value();

            if (bodyParams.length > 0) {
              return {
                description: "Body",
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: _.fromPairs(bodyParams),
                      required: bodyParams.map(pair => pair[0]),
                    }
                  }
                }
              };
            } else {
              return undefined;
            }
          })(),
          responses: (() => {
            if (endRoute.responses) {
              return Array.from(endRoute.responses)
                .reduce((obj, [statusCode, response]) => {
                  obj[statusCode] = {
                    description: response.desc || "",
                    content: {
                      "application/json": {
                        schema: response.schema,
                      },
                    },
                  };
                  return obj;
                }, {} as { [key: string]: OpenApi.ResponsesObject });
            } else {
              return {
                200: {
                  description: "Success"
                }
              };
            }
          })(),
        };
        return operation;
      })();
    });

    const spec: OpenApi.OpenAPIObject = {
      openapi: "3.0.1",
      info: {
        title: info.title,
        version: info.version,
      },
      servers: [{
        url: `${request.headers["X-Forwarded-Proto"]}://${request.headers.Host}/${request.requestContext!.stage}/`,
      }],
      tags: [],
      paths,
      components: {
        schemas: info.definitions,
      },
    };
    return spec;
  }

  public toOpenAPIPath(path: string) {
    return path.replace(/\:(\w+)/g, "{$1}");
  }
}
