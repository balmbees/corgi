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
    Route.POST('/api/a', 'a', {}, async function(this: RoutingContext) {
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
        info: {
          title: "TEST API",
          version: "1.0.0",
        },
        host: "www.vingle.net",
        basePath: "/",
      },
      _routes
    ),
    ..._routes,
  ]

  it("should return JSON doc", async () => {
    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/doc",
      httpMethod: 'GET'
    } as any);

    chai.expect(res).to.include({
      statusCode: 200,
      body: JSON.stringify({
          "info": {
              "title": "TEST API",
              "version": "1.0.0"
          },
          "swagger": "2.0",
          "produces": ["application/json; charset=utf-8"],
          "host": "www.vingle.net",
          "basePath": "/",
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
                      "operationId": "GetApi"
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
                      "operationId": "PostApiA"
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
      })
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

  it("should have CORS headers on GET method response", async () => {
    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/doc",
      httpMethod: 'GET',
      headers: {
        'Origin': 'https://foo.bar'
      }
    } as any);

    chai.expect(res.headers).to.include({
      'Access-Control-Allow-Origin': 'https://foo.bar',
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
      ).to.eq('GetUsersInterests');
    });
  });
});