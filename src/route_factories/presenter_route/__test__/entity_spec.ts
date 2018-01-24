import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import {
  Entity,
  EntityPresenterFactory,
} from '../../../index';
import * as Joi from 'joi';

import * as ClassValidator from "class-validator";
import * as ClassValidatorJSONSchema from "class-validator-jsonschema";

describe(EntityPresenterFactory.name, () => {
  describe("#create", () => {
    it("should presenter singleton", async () => {
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

      const presenter = EntityPresenterFactory.create(TestModel, TestEntity, function (input: TestModel) {
        const entity = new TestEntity();
        entity.id = input.id.toString();
        entity.name = input.name.toLowerCase();
        return entity;
      });

      // it should generate output Schema from object
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

      // Should return same object all the time, so that we can reuse in swagger docs
      expect(presenter.outputJSONSchema()).to.be.eq(presenter.outputJSONSchema());
    });
  });
});
