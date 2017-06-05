import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  SwaggerRoute,
  Parameter,
} from '../index';
import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

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

    chai.expect(res).to.deep.eq({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        "info": {
          "title": "TEST API",
          "version": "1.0.0"
        },
        "swagger": "2.0",
        "produces": [
          "application/json; charset=utf-8"
        ],
        "host": "www.vingle.net",
        "basePath": "/",
        "tags": [],
        "paths": {
          "/api/{userId}": {
            "get": {
              "description": "a",
              "produces": [
                "application/json; charset=utf-8"
              ],
              "parameters": [
                {
                  "in": "path",
                  "name": "userId",
                  "description": "",
                  "type": "number",
                  "required": true
                },
                {
                  "in": "query",
                  "name": "testerId",
                  "description": "",
                  "type": "number",
                  "required": true
                }
              ],
              "responses": {
                "200": {
                  "description": "Success"
                }
              },
              "tags": [],
              "operationId": "GET - /api/{userId}"
            }
          },
          "/api/a": {
            "post": {
              "description": "a",
              "produces": [
                "application/json; charset=utf-8"
              ],
              "parameters": [],
              "responses": {
                "200": {
                  "description": "Success"
                }
              },
              "tags": [],
              "operationId": "POST - /api/a"
            }
          },
          "/api/c": {
            "get": {
              "description": "a",
              "produces": [
                "application/json; charset=utf-8"
              ],
              "parameters": [],
              "responses": {
                "200": {
                  "description": "Success"
                }
              },
              "tags": [],
              "operationId": "GET - /api/c"
            }
          }
        }
      })
    });
  });
});

