import { expect } from "chai";

import {
  EntityPresenterFactory,
  Router,
  PresenterRouteFactory,
} from '../../../index';

import { TestEntity } from "../../../__test__/entity";

describe(PresenterRouteFactory.name, () => {
  describe("#create", () => {
    it("should create route that using given presenter", async () => {
      class TestModel {
        id: number;
        name: string;
      }

      const presenter = EntityPresenterFactory.create(TestEntity, function(input: TestModel) {
        const entity = new TestEntity();
        entity.id = input.id.toString();
        entity.name = input.name.toLowerCase();
        return entity;
      });

      expect(presenter.outputJSONSchema()).to.be.deep.eq({
        "$ref": "#/definitions/TestEntity"
      });
      // Should return same object
      expect(presenter.outputJSONSchema()).to.be.eq(presenter.outputJSONSchema());

      const route = PresenterRouteFactory.GET(
        "/api", {
          desc: "test", operationId: "getAPI"
        }, {
        }, presenter
        , async function () {
          const model = new TestModel();
          model.id = 100;
          model.name = "AbcD";
          return model;
        },
      );
      expect(route.operationId).to.be.eq("getAPI");

      const router = new Router([
        route,
      ]);
      const res = await router.resolve({
        path: "/api",
        httpMethod: 'GET',
      } as any, { timeout: 10000 });

      expect(res).to.deep.eq({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: "100", name: "abcd" })
      });
    });
  });
});
