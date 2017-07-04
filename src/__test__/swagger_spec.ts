import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
} from '../index';

import {
  SwaggerGenerator,
  SwaggerRoute,
} from '../swagger';

import * as LambdaProxy from '../lambda-proxy';

import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("SwaggerRoute", () => {
  const _routes: Routes = [
    Route.GET('/api/:userId', 'a', {
      userId: Parameter.Path(Joi.number()),
      testerId: Parameter.Query(Joi.number().required()),
    }, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.POST('/api/a', { desc: 'a', operationId: "GetAPIa" }, {}, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.GET('/api/c', 'a', {}, async function(this: RoutingContext) {
      return this.json({});
    }),
  ];
  const routes = [
    new SwaggerRoute(
      '/api/doc',
      {
        title: "TEST API",
        version: "1.0.0",
      },
      _routes
    ),
    ..._routes,
  ]

  const mockRequest: LambdaProxy.Event = {
    path: "/api/doc",
    httpMethod: "GET",
    headers: {
      "Host": "api.example.net",
      "Origin": "https://foo.bar",
      "X-Forwarded-Proto": "https",
    },
    requestContext: {
      requestId: "stub",
      stage: "prod",
    }
  } as any;

  it("should return JSON doc", async () => {
    const router = new Router(routes);
    const res = await router.resolve(mockRequest);

    chai.expect(res.statusCode).to.eq(200)
    chai.expect(JSON.parse(res.body)).to.deep.eq({
      "info": {
        "title": "TEST API",
        "version": "1.0.0"
      },
      "swagger": "2.0",
      "produces": ["application/json; charset=utf-8"],
      "host": "api.example.net",
      "basePath": "/prod/",
      "schemes": [
        "https"
      ],
      "tags": [],
      "paths": {
        "/api/{userId}": {
          "get": {
            "description": "a",
            "produces": ["application/json; charset=utf-8"],
            "parameters": [{
              "in": "path",
              "name": "userId",
              "description": "",
              "type": "number",
              "required": true
            }, {
              "in": "query",
              "name": "testerId",
              "description": "",
              "type": "number",
              "required": true
            }],
            "responses": {
              "200": {
                "description": "Success"
              }
            },
            "operationId": "GetApiUserId"
          }
        },
        "/api/a": {
          "post": {
            "description": "a",
            "produces": ["application/json; charset=utf-8"],
            "parameters": [],
            "responses": {
              "200": {
                "description": "Success"
              }
            },
            "operationId": "GetAPIa",
          }
        },
        "/api/c": {
          "get": {
            "description": "a",
            "produces": ["application/json; charset=utf-8"],
            "parameters": [],
            "responses": {
              "200": {
                "description": "Success"
              }
            },
            "operationId": "GetApiC"
          }
        }
      }
    });

    chai.expect(res.headers).to.include({
      'Access-Control-Allow-Origin': 'https://foo.bar',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
      'Access-Control-Max-Age': `${60 * 60 * 24 * 30}`,
    });
  });

  it("should accept OPTIONS method for CORS Pre-flight request", async () => {
    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/doc",
      httpMethod: 'OPTIONS',
      headers: {
        'Origin': 'https://www.vingle.net'
      }
    } as any);

    chai.expect(res.statusCode).to.be.eq(204);
    chai.expect(res.headers).to.include({
      'Access-Control-Allow-Origin': 'https://www.vingle.net',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
      'Access-Control-Max-Age': `${60 * 60 * 24 * 30}`,
    });
  });
});

describe(SwaggerGenerator.name, () => {
  describe("#toSwaggerPath", () => {
    it("should convert regexPath to swaggerPath", () => {
      const generator = new SwaggerGenerator();
      expect(
      generator.toSwaggerPath('/users/:userId/interests/:interest')
      ).to.eq('/users/{userId}/interests/{interest}');
    });
  });

  describe("#routesToOperationId", () => {
    it("should build natural operationId from given path and method", () => {
      const generator = new SwaggerGenerator();
      expect(
      generator.routesToOperationId(
      '/users/:userId/interests/:interest',
      'GET',
      )
      ).to.eq('GetUsersUserIdInterestsInterest');
    });
  });
});