import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
} from '../index';
import * as Joi from 'joi';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);


describe("Router", () => {
  describe("#handler", () => {
    it("should raise timeout if it's really get delayed", async () => {
      const router = new Router([
        Route.GET('/', '', {}, async function() {
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve();
            }, 200);
          });

          return this.json({});
        })
      ]);
      const handler = router.handler();

      const res = await new Promise((resolve, reject) => {
        handler(
          {
            path: '/',
            httpMethod: 'GET',
            queryStringParameters: {
            },
            requestContext: {
              "requestId": "request-id",
            }
          } as any,
          {
            succeed: function(result?: Object) {
              this.done(result);
            },
            fail: function(error: Error) {
              this.done(error);
            },
            done: function(error: Error | null, result?: Response) {
              resolve(error || result);
            },
            getRemainingTimeInMillis: function() {
              return 100;
            }
          } as any
        );
      });

      chai.expect(res).to.deep.eq({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          "error":{"id":"request-id","message":"Service timeout. {\"path\":\"/\",\"httpMethod\":\"GET\",\"queryStringParameters\":{},\"requestContext\":{\"requestId\":\"request-id\"}}"}
        }),
      });
    });
  });
});
