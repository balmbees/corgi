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
        Route.GET('/test', '', {}, async function() {
          throw new CustomError("TEST ERROR");
        })
      ]);

      const router = new Router([rootNamespace]);
      const res = await router.resolve({
        path: '/test',
        httpMethod: 'GET',
        requestContext: {
          "requestId": "request-id",
        }
      } as any);
      console.log(JSON.stringify(res, null, 2));
      expect(res).to.deep.eq({
        "statusCode": 500,
        "headers": {
          "Content-Type": "application/json; charset=utf-8"
        },
        "body": JSON.stringify(
          {
            errors: [
              { id: 'request-id', message: 'TEST ERROR' }
            ]
          }
        )
      });
    });
  });
});

