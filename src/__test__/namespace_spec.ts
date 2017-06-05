import { Route } from '../route';
import { Namespace } from '../namespace';
import { RoutingContext } from '../routing-context';
import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Namespace", () => {
  describe("#constructor", () => {
    it("should construct object with given options", () => {
      const namespace  =
        new Namespace('/api', {
          children: [
            Route.GET('/test', '', {}, async function() {
              return this.json({});
            })
          ]
        });

      expect(namespace).to.be.instanceof(Namespace);
      expect(namespace.path).to.deep.eq('/api');
    });

    it("should raise error when there is no child", () => {
      expect(function() {
        new Namespace('/api', { children: [] });
      }).to.throw(Error);
    });
  });


});

