import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
} from '../../index';

import {
  SwaggerGenerator,
  SwaggerRoute,
} from '../index';

import * as LambdaProxy from '../../lambda-proxy';

import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("SwaggerRoute", () => {
  const PaginatedUserArraySchema = Joi.object({
    data: Joi.array().items(Joi.object({
      id: Joi.number().integer(),
      username: Joi.string(),
    }))
  });

  const _routes: Routes = [
    Route.GET('/api/:userId', { desc: 'a', operationId: 'GetApiUserId' }, {
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
    Route.POST('/api/a', { desc: 'a', operationId: "GetAPIa" }, {}, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.GET('/api/c', { desc: 'a', operationId: "GetApiC" }, {}, async function(this: RoutingContext) {
      return this.json({});
    }),
    Route.GET(
      '/api/users',
      {
        desc: 'get all users',
        operationId: "GetUsers",
        responses: {
          [200]: {
            desc: "Success",
            schema: PaginatedUserArraySchema,
          }
        }
      },
      {},
      async function (this: RoutingContext) {
        return this.json({
          data: [{
            id: 100,
            username: "abcd",
          }]
        });
      }),
  ];
  const routes = [
    new SwaggerRoute(
      '/api/doc',
      {
        title: "TEST API",
        version: "1.0.0",
        definitions: {
          PaginatedUsers: PaginatedUserArraySchema,
        }
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
      stage: "prod",
    },
  } as any;

  it("should return JSON doc", async () => {
    const router = new Router(routes);
    const res = await router.resolve(mockRequest);

    chai.expect(res.statusCode).to.eq(200);

    chai.expect(JSON.parse(res.body)).to.deep.eq({
      "swagger":"2.0",
      "info":{
          "title":"TEST API",
          "version":"1.0.0"
      },
      "definitions": {
        "PaginatedUsers": {
          "properties": {
            "data": {
              "items": {
                "properties": {
                  "id": {
                    "type": "integer"
                  },
                  "username": {
                    "type": "string"
                  },
                },
                "type": "object"
              },
              "type": "array"
            }
          },
          "type": "object"
        }
      },
      "host":"api.example.net",
      "basePath":"/prod/",
      "schemes":[
          "https"
      ],
      "produces":[
          "application/json; charset=utf-8"
      ],
      "paths":{
          "/api/{userId}":{
            "get":{
                "description":"a",
                "produces":[
                  "application/json; charset=utf-8"
                ],
                "parameters":[
                  {
                      "in":"path",
                      "name":"userId",
                      "description":"",
                      "type":"integer",
                      "required": true
                  },
                  {
                      "in":"query",
                      "name":"testerId",
                      "description":"",
                      "type":"number",
                  },
                  {
                      "in":"query",
                      "name":"userIds",
                      "description":"",
                      "type":"array",
                      "items":{
                        "type":"number",
                      }
                  },
                  {
                      "in":"body",
                      "name":"user",
                      "description":"",
                      "schema":{
                        "type":"object",
                        "required":[
                            "name"
                        ],
                        "properties":{
                            "name":{
                              "type":"string"
                            },
                            "tags":{
                              "type":"array",
                              "items":{
                                  "type":"object",
                                  "properties":{
                                    "name":{
                                        "type":"string"
                                    }
                                  }
                              }
                            },
                          "test": {
                            "properties": {},
                            "type": "object",
                          },
                        }
                      },
                      "required": true
                  }
                ],
                "responses":{
                  "200":{
                      "description":"Success"
                  }
                },
                "operationId":"GetApiUserId"
            }
          },
          "/api/a":{
            "post":{
                "description":"a",
                "produces":[
                  "application/json; charset=utf-8"
                ],
                "parameters":[

                ],
                "responses":{
                  "200":{
                      "description":"Success"
                  }
                },
                "operationId":"GetAPIa"
            }
          },
          "/api/c":{
            "get":{
                "description":"a",
                "produces":[
                  "application/json; charset=utf-8"
                ],
                "parameters":[

                ],
                "responses":{
                  "200":{
                      "description":"Success"
                  }
                },
                "operationId":"GetApiC"
            }
          },
          "/api/users": {
            "get": {
              "description": "get all users",
              "produces": [
                "application/json; charset=utf-8"
              ],
              "parameters": [

              ],
              "responses": {
                "200": {
                  "description": "Success",
                  "schema": {
                    "$ref": "#/definitions/PaginatedUsers",
                  }
                }
              },
              "operationId": "GetUsers"
            }
          }
      },
      "tags":[

      ]
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