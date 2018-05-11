import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { Route } from '../route';
import { Router } from '../router';
import { RootNamespace } from '../root-namespace';

class CustomError extends Error {

}

describe("RootNamespace", () => {
  describe("#exceptionHandler", () => {
    it("should handler general error and build json response", async () => {
      const rootNamespace = new RootNamespace([
        Route.GET('/test', { operationId: "test" }, {}, async function() {
          throw new CustomError("TEST ERROR");
        })
      ]);

      const router = new Router([rootNamespace]);
      const res = await router.resolve({
        path: '/test',
        httpMethod: 'GET',
      } as any, { requestId: "request-id", timeout: 10000 });

      expect(JSON.parse(res["body"])).to.deep.eq({
        'error':{
          'id':'request-id',
          'summary':'Ooops something went wrong',
          'message':'Error : TEST ERROR'
        }
      });
      expect(res.statusCode).to.be.eq(500);
    });
  });
});

