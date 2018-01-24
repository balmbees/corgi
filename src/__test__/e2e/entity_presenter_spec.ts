import {
  DataLayoutPresenter,
  EntityPresenterFactory,
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
  Presenter,
  PresenterRouteFactory,
  SwaggerRoute,
} from '../../index';
import * as Joi from 'joi';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import * as ClassValidator from "class-validator";
import * as ClassValidatorJSONSchema from "class-validator-jsonschema";

class TestAliasEntity {
  @ClassValidator.IsString()
  public aliasName: string;
}

class TestEntity {
  @ClassValidator.IsNumber()
  public id: string;

  @ClassValidator.IsString()
  public name: string;

  @ClassValidator.ValidateNested()
  public alias: TestAliasEntity;
}

const arrayPresenter = EntityPresenterFactory.createArray(TestEntity, (input: number[]) => {
  return input.map(i => {
    const entity = new TestEntity();
    entity.id = i.toString();
    entity.name = i.toString() + i.toString();

    entity.alias = new TestAliasEntity();
    entity.alias.aliasName = i.toString() + i.toString() + i.toString();

    return entity;
  });
});


const dataArrayPresenter = new DataLayoutPresenter(arrayPresenter);

describe("Calling complex API", () => {
  const routes: Routes = [
    new Namespace('/api/:userId', {
      params: {
        userId: Joi.number()
      },
      children: [
        PresenterRouteFactory.GET(
          '/followers', {
            operationId: "getFollowers",
            desc: 'List of users that following me',
          }, {}
          , dataArrayPresenter
          , async function () {
            return [1, 2];
          }
        ),
      ]
    })
  ];

  const router = new Router([
    new SwaggerRoute(
      "/swagger",
      {
        title: "InterestService",
        version: "1.0.0",
        definitions: Object.assign(EntityPresenterFactory.schemas(), {
          TestEntityArrayData: dataArrayPresenter.outputJSONSchema(),
        }),
      },
      routes,
    ),
    new Namespace("", {
      children: routes,
    }),
  ]);

  it("should work with presenter (Wrapped with data)", async () => {
    const res = await router.resolve({
      path: "/api/33/followers",
      httpMethod: 'GET',
    } as any);

    chai.expect(res).to.deep.eq({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        "data": [
          { "id": "1", "name": "11", "alias": { "aliasName": "111" } },
          { "id": "2", "name": "22", "alias": { "aliasName": "222" } }
        ]
      }),
    });
  });

  it("should work swaggerResponses", async () => {
    const res = await router.resolve({
      path: "/swagger",
      httpMethod: 'GET',
      headers: {
        Host: "local.me",
        "X-Forwarded-Proto": "http"
      },
      requestContext: {
        stage: "test"
      }
    } as any);

    chai.expect(res["statusCode"]).to.eq(200);
    // This thing must be validated by https://editor.swagger.io
    chai.expect(JSON.parse(res["body"])).to.deep.eq({
      "swagger": "2.0",
      "info": {
        "title": "InterestService",
        "version": "1.0.0"
      },
      "host": "local.me",
      "basePath": "/test/",
      "schemes": [
        "http"
      ],
      "produces": [
        "application/json; charset=utf-8"
      ],
      "paths": {
        "/api/{userId}/followers": {
          "get": {
            "description": "List of users that following me",
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
              }
            ],
            "responses": {
              "200": {
                "description": "Success",
                "schema": {
                  "$ref": "#/definitions/TestEntityArrayData"
                }
              }
            },
            "operationId": "GetApiUserIdFollowers"
          }
        }
      },
      "tags": [

      ],
      "definitions": {
        "TestAliasEntity": {
          "properties": {
            "aliasName": {
              "type": "string"
            }
          },
          "required": [
            "aliasName"
          ],
          "type": "object"
        },
        "TestEntity": {
          "properties": {
            "id": {
              "type": "number"
            },
            "name": {
              "type": "string"
            },
            "alias": {
              "$ref": "#/definitions/TestAliasEntity"
            }
          },
          "required": [
            "id",
            "name",
            "alias"
          ],
          "type": "object"
        },
        "TestEntityArrayData": {
          "type": "object",
          "properties": {
            "data": {
              "type": "array",
              "items": {
                "$ref": "#/definitions/TestEntity"
              },
            },
          },
          "required": ["data"],
        }
      }
    })
  });
});
