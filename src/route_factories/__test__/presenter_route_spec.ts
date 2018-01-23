import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
  PresenterRouteFactory,
} from '../../index';
import * as Joi from 'joi';

describe(PresenterRouteFactory.name, () => {
  describe("#create", () => {
    it("should create route that using given presenter", async () => {
      const presenter = {
        outputJSONSchema: {
          "type": "object",
          "properties": {
            "cleaned": {
              "type": "integer",
              "title": "The Id Schema.",
              "description": "An explanation about the purpose of this instance.",
              "default": 0,
            },
          }
        },
        present(input: { id: number, name: string }) {
          return {
            id: input.id.toString(),
            name: input.name.toLowerCase(),
          };
        }
      };

      const router = new Router([
        PresenterRouteFactory.create(
          "/api",
          "GET", {
            desc: "test", operationId: "getAPI"
          }, {
          }, async () => {
            return { id: 100, name: "ABCD" }
          },
          presenter,
        )
      ]);
      const res = await router.resolve({
        path: "/api",
        httpMethod: 'GET',
      } as any);

      chai.expect(res).to.deep.eq({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(presenter.present({ id: 100, name: "ABCD" }))
      });
    });
  });
});
