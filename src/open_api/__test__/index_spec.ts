import { expect } from "chai";

import {
  Parameter,
  Route,
  Router,
  Routes,
  RoutingContext,
} from "../../index";

import {
  OpenAPIGenerator,
  OpenAPIRoute,
} from "../index";

import * as LambdaProxy from "../../lambda-proxy";

import * as Joi from "joi";

describe("OpenAPIRoute", () => {
  const definitions = {
    User: {
      type: "object",
      properties: {
        checked: {
          type: "boolean",
          title: "The Checked Schema.",
          description: "An explanation about the purpose of this instance.",
          default: false,
        },
        dimensions: {
          type: "object",
          properties: {
            width: {
              type: "integer",
              title: "The Width Schema.",
              description: "An explanation about the purpose of this instance.",
              default: 0,
            },
            height: {
              type: "integer",
              title: "The Height Schema.",
              description: "An explanation about the purpose of this instance.",
              default: 0,
            }
          }
        },
        id: {
          type: "integer",
          title: "The Id Schema.",
          description: "An explanation about the purpose of this instance.",
          default: 0,
        },
        name: {
          type: "string",
          title: "The Name Schema.",
          description: "An explanation about the purpose of this instance.",
          default: "",
        },
        price: {
          type: "number",
          title: "The Price Schema.",
          description: "An explanation about the purpose of this instance.",
          default: 0,
        },
        tags: {
          type: "array",
          items: {
            type: "string",
            title: "The 0 Schema.",
            description: "An explanation about the purpose of this instance.",
            default: "",
          }
        }
      }
    },
    UserList: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            $ref: "#/components/schemas/User"
          }
        }
      }
    }
  };

  const actionRoutes: Routes = [
    Route.POST("/api", { desc: "a", operationId: "createUser" }, {
      userId: Parameter.Path(Joi.number().integer()),
      testerId: Parameter.Query(Joi.number().required()),
      userIds: Parameter.Query(Joi.array().items(Joi.number())),
      user: Parameter.Body(Joi.object({
        name: Joi.string().required(),
        tags: Joi.array().items(Joi.object({
          name: Joi.string()
        }), Joi.string()),
        test: Joi.object(),
      }))
    }, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.POST("/api/a", { desc: "a", operationId: "GetAPIa" }, {}, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.GET("/api/c", { desc: "a", operationId: "GetApiC" }, {}, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.GET(
      "/api/users2",
      {
        desc: "get all users",
        operationId: "GetUsers2",
        responses: {
          [200]: {
            desc: "Success",
            schema: definitions.User,
          }
        }
      },
      {},
      async function(this: RoutingContext) {
        return this.json({
          data: [{
            id: 100,
            username: "abcd",
          }]
        });
      }),
    Route.GET(
      "/api/users",
      {
        desc: "get all users",
        operationId: "GetUsers",
        responses: {
          [200]: {
            desc: "Success",
            schema: {
              $ref: "#/components/schemas/UserList",
            },
          }
        }
      },
      {},
      async function(this: RoutingContext) {
        return this.json({
          data: [{
            id: 100,
            username: "abcd",
          }]
        });
      }),
  ];
  const routes = [
    new OpenAPIRoute(
      "/api/doc",
      {
        title: "TEST API",
        version: "1.0.0",
        definitions,
      },
      actionRoutes
    ),
    ...actionRoutes,
  ];

  const mockRequest: LambdaProxy.Event = {
    path: "/api/doc",
    httpMethod: "GET",
    headers: {
      "Host": "api.example.net",
      "Origin": "https://foo.bar",
      "X-Forwarded-Proto": "https",
    },
    requestContext: {
      stage: "prod",
    },
  } as any;

  it("should return JSON doc", async () => {
    const router = new Router(routes);
    const res = await router.resolve(mockRequest, { timeout: 10000 });
    expect(res.statusCode).to.eq(200);
    expect(res.headers).to.include({
      "Access-Control-Allow-Origin": "https://foo.bar",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].join(", "),
      "Access-Control-Max-Age": `${60 * 60 * 24 * 30}`,
    });
  });

  it("should accept OPTIONS method for CORS Pre-flight request", async () => {
    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/doc",
      httpMethod: "OPTIONS",
      headers: {
        Origin: "https://www.vingle.net"
      }
    } as any, { timeout: 10000 });

    expect(res.statusCode).to.be.eq(204);
    expect(res.headers).to.include({
      "Access-Control-Allow-Origin": "https://www.vingle.net",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].join(", "),
      "Access-Control-Max-Age": `${60 * 60 * 24 * 30}`,
    });
  });
});

describe(OpenAPIGenerator.name, () => {
  describe("#toSwaggerPath", () => {
    it("should convert regexPath to swaggerPath", () => {
      const generator = new OpenAPIGenerator();
      expect(
      generator.toOpenAPIPath("/users/:userId/interests/:interest")
      ).to.eq("/users/{userId}/interests/{interest}");
    });
  });
});
