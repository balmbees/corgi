import { Route } from '../route';
import { RoutingContext } from '../routing-context';
import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Route", () => {
  describe("#constructor", () => {
    it("should construct object with given options", () => {
      const route =
        new Route({
          path: '/followers',
          method: 'GET',
          desc: 'List of users that following me',
          handler: async function(this: RoutingContext) {
            return this.json({
              data: {}
            })
          }
        });

      expect(route.path).to.deep.eq('/followers');
      expect(route.method).to.deep.eq('GET');
      expect(route.desc).to.deep.eq('List of users that following me');
    });
  });

  describe("#validateParams", () => {
    const route =
      new Route({
        path: '/a/:userId',
        method: 'GET',
        desc: 'List of users that following me',
        params: {
          userId: Joi.number().min(1).max(100)
        },
        handler: async function(this: RoutingContext) { return this.json({}) }
      });

    it("should validate given params", () => {
      const res = route.validateParams({
        userId: "123"
      });
      expect(res.error.name).to.eq('ValidationError');
      expect(res.error.details[0].message).to.eq(`"userId" must be less than or equal to 100`);
    });

    it("should validate given params", () => {
      const res = route.validateParams({
        userId: "52"
      });
      expect(res.error).to.be.null;
      expect(res.value).to.deep.eq({ userId: 52 });
    });
  });
});

