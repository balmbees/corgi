import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
  Middleware,
  Response,
} from '../index';
import * as Joi from 'joi';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("Router", () => {
  describe("#handler", () => {
    describe("middlewares", () => {
      it("should run middlewares one by one in order", async () => {
        const router = new Router([
          Route.GET('/', '', {}, async function() {
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json; charset=utf-8' },
              body: this.request.body!,
            };
          })
        ], {
          middlewares: [
            {
              before: async function(routingContext: RoutingContext): Promise<Response | void> {
                routingContext.request.body = "A";
              },
              after: async function(routingContext: RoutingContext, response: Response): Promise<Response> {
                response.body += "C";
                return response;
              }
            }, {
              before: async function(routingContext: RoutingContext): Promise<Response | void> {
                routingContext.request.body += "B";
              },
              after: async function(routingContext: RoutingContext, response: Response): Promise<Response> {
                response.body += "D";
                return response;
              }
            }
          ]
        });

        const res = await router.resolve({
          path: '/',
          httpMethod: 'GET',
          queryStringParameters: {
          },
          requestContext: {
            "requestId": "request-id",
          }
        } as any);

        expect(res.body).to.eq("ABDC");
      });
    });

    it.only("should raise timeout if it's really get delayed", async () => {
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
              this.done(undefined, result);
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

      // chai.expect(res).to.deep.eq({
      //   statusCode: 500,
      //   headers: { 'Content-Type': 'application/json; charset=utf-8' },
      //   body: JSON.stringify({
      //     "error":{"id":"request-id","message":"Service timeout. {\"path\":\"/\",\"httpMethod\":\"GET\",\"queryStringParameters\":{},\"requestContext\":{\"requestId\":\"request-id\"}}"}
      //   }),
      // });
    });
  });
});
