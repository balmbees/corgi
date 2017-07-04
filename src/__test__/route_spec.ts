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
          operationId: 'getFollowers',
          desc: 'List of users that following me',
          handler: async function(this: RoutingContext) {
            return this.json({
              data: {}
            })
          }
        });

      expect(route.operationId).to.eq("getFollowers");
      expect(route.path).to.deep.eq('/followers');
      expect(route.method).to.deep.eq('GET');
      expect(route.desc).to.deep.eq('List of users that following me');
    });
  });
});

