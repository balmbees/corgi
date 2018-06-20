import { expect } from "chai";

import { Route } from '../route';
import { Namespace } from '../namespace';

describe("Namespace", () => {
  describe("#constructor", () => {
    it("should construct object with given options", () => {
      const namespace  =
        new Namespace('/api', {
          children: [
            Route.GET('/test', { operationId: "test" }, {}, async function() {
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
