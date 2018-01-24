import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import {
  Entity,
  EntityPresenterFactory,
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
  Presenter,
  PresenterRouteFactory,
} from '../../../index';
import * as Joi from 'joi';

import * as ClassValidator from "class-validator";
import * as ClassValidatorJSONSchema from "class-validator-jsonschema";

describe(PresenterRouteFactory.name, () => {
  describe("#create", () => {
    it("should create route that using given presenter", async () => {
      class TestEntity {
        @ClassValidator.IsNumber()
        public id: string;

        @ClassValidator.IsString()
        public name: string;
      }

      class TestModel {
        id: number;
        name: string;
      }

      const presenter = EntityPresenterFactory.create(TestModel, TestEntity, function(input: TestModel) {
        const entity = new TestEntity();
        entity.id = input.id.toString();
        entity.name = input.name.toLowerCase();
        return entity;
      });

      expect(presenter.outputJSONSchema()).to.be.deep.eq({
        "properties": {
          "id": {
            "type": "number"
          },
          "name": {
            "type": "string"
          },
        },
        "required": [
          "id",
          "name",
        ],
        "type": "object",
      });
      // Should return same object
      expect(presenter.outputJSONSchema()).to.be.eq(presenter.outputJSONSchema());


      const router = new Router([
        PresenterRouteFactory.GET(
          "/api", {
            desc: "test", operationId: "getAPI"
          }, {
          }, presenter
          , async function() {
            const model = new TestModel();
            model.id = 100;
            model.name = "AbcD";
            return model;
          },
        )
      ]);
      const res = await router.resolve({
        path: "/api",
        httpMethod: 'GET',
      } as any);

      chai.expect(res).to.deep.eq({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id: "100", name: "abcd" })
      });
    });
  });
});
