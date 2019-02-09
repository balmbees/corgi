import { expect } from "chai";

import * as Joi from "joi";
import {
  Middleware,
  MiddlewareAfterOptions,
  Namespace,
  Response,
  Route,
  Router,
} from "../../index";

describe("Calling complex middleware connected API", () => {
  it("should run middleware after exception handler", async () => {
    const router = new Router(
      [
        new Namespace("/api/:userId", {
          params: {
            userId: Joi.number()
          },
          async exceptionHandler(error: Error) {
            // 2
            return this.json(
              {
                error: error.message,
              },
              500
            );
          },
          children: [
            new Route({
              path: "/followers",
              method: "GET",
              operationId: "getFollowers",
              desc: "List of users that following me",
              async handler() {
                // 1
                throw new Error(`Error: ${this.params.userId}`);
              }
            }),
          ]
        })
      ], {
        middlewares: [
          new (class TestMiddleware extends Middleware<void> {
            public async after(options: MiddlewareAfterOptions<void>): Promise<Response> {
              const { response } = options;
              // 3
              if (response.statusCode === 500) {
                response.headers.error = "XX";
              }
              return options.response;
            }
          })()
        ]
      }
    );
    const res = await router.resolve({
      path: "/api/33/followers",
      httpMethod: "GET"
    } as any, { timeout: 10000 });

    expect(res).to.deep.eq({
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "error": "XX"
      },
      body: JSON.stringify({ error: `Error: 33`}),
    });
  });
});
