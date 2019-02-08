import { expect } from "chai";

import { EntityPresenterFactory } from "../../../index";

import { TestEntity } from "../../../__test__/entity";

describe(EntityPresenterFactory.name, () => {
  class TestModel {

    public static create(id: number, name: string) {
      const model = new this();
      model.id = id;
      model.name = name;
      return model;
    }
    public id: number;
    public name: string;
  }

  describe("#schemas", () => {
    it("should return", () => {
      expect(EntityPresenterFactory.schemas()).to.be.deep.eq({
        TestAliasEntity: {
          properties: {
            aliasName: {
              type: "string"
            }
          },
          required: [
            "aliasName"
          ],
          type: "object"
        },
        TestEntity: {
          properties: {
            id: {
              type: "number"
            },
            name: {
              type: "string",
              description: "This field is nullable, value can be null."
            },
            alias: {
              $ref: "#/definitions/TestAliasEntity"
            },
            stats: {
              type: "array",
              items: {
                $ref: "#/definitions/TestStatEntity"
              }
            },
            names: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          required: [
            "id",
            "name"
          ],
          type: "object"
        },
        TestStatEntity: {
          properties: {
            count: {
              type: "number"
            }
          },
          required: [
            "count"
          ],
          type: "object"
        }
      });
    });
  });

  describe("#create", () => {
    const presenter = EntityPresenterFactory.create(TestEntity, function(input: TestModel) {
      const entity = new TestEntity();
      entity.id = input.id.toString();
      entity.name = input.name.toLowerCase();
      return entity;
    });

    it("should presenter singleton", async () => {
      // it should generate output Schema from object
      expect(presenter.outputJSONSchema()).to.be.deep.eq({
        $ref: "#/definitions/TestEntity"
      });

      // Should return same object all the time, so that we can reuse in swagger docs
      expect(presenter.outputJSONSchema()).to.be.eq(presenter.outputJSONSchema());
    });

    it("should present", async () => {
      const model = TestModel.create(1234, "XXYY");

      expect(await presenter.present(model)).to.deep.eq({
        id: "1234",
        name: "xxyy",
      });
    });
  });

  describe("#createArray", () => {
    const presenter = EntityPresenterFactory.createArray(TestEntity, function(input: TestModel[]) {
      return input.map(model => {
        const entity = new TestEntity();
        entity.id = model.id.toString();
        entity.name = model.name.toLowerCase();
        return entity;
      });
    });

    it("should presenter singleton", async () => {
      // it should generate output Schema from object
      expect(presenter.outputJSONSchema()).to.be.deep.eq({
        type: "array",
        items: { $ref: "#/definitions/TestEntity" },
      });

      // Should return same object all the time, so that we can reuse in swagger docs
      expect(presenter.outputJSONSchema()).to.be.eq(presenter.outputJSONSchema());
    });

    it("should present", async () => {
      const models = [
        TestModel.create(1234, "XXYY"),
        TestModel.create(4321, "YYXX"),
      ];

      expect(await presenter.present(models)).to.deep.eq([
        {
          id: "1234", name: "xxyy",
        }, {
          id: "4321", name: "yyxx",
        }
      ]);
    });
  });
});
