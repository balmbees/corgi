import { expect } from "chai";

import * as Joi from "joi";
import {
  Namespace,
  Parameter,
  Route,
  Router,
  Routes,
} from "../../index";

describe("Calling complex API", () => {
  it("should exist", async () => {
    const routes: Routes = [
      new Namespace("/api/:userId", {
        params: {
          userId: Joi.number()
        },
        children: [
          new Route({
            path: "/followers",
            method: "GET",
            operationId: "getFollowers",
            desc: "List of users that following me",
            async handler() {
              return this.json({
                data: {}
              });
            }}
          ),
          new Namespace("/followings", {
            async before() {
              //
            },
            children: [
              Route.POST("/", { operationId: "follow" }, {
                testId: Parameter.Query(Joi.number()),
                update: Parameter.Body(
                  Joi.object({
                    fieldA: Joi.number()
                  })
                )
              }, async function() {
                const userId = this.params.userId as number;
                const testId = this.params.testId as number;

                return this.json({
                  testId,
                  userId,
                  update: this.params.update,
                });
              }),

              Route.PATCH("/", { operationId: "patchFollow" }, {
                testId: Parameter.Query(Joi.number()),
              }, async function() {
                const userId = this.params.userId as number;
                const testId = this.params.testId as number;

                return this.json({
                  testId,
                  userId,
                });
              }),

              Route.DELETE("/", { operationId: "unfollow" }, {}, async function() {
                const userId = this.params.userId as number;
                return this.json({ userId });
              }),
            ]
          })
        ]
      })
    ];

    const router = new Router(routes);
    expect(await router.resolve({
      path: "/api/33/followings",
      httpMethod: "POST",
      body: JSON.stringify({
        update: {
          fieldA: 12345,
          fieldB: 54321,
        }
      }),
      queryStringParameters: {
        testId: "12345",
        not_allowed_param: "xxx",
      }
    } as any, { timeout: 10000 })).to.deep.eq({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        testId: 12345,
        userId: 33,
        update: {
          fieldA: 12345,
        }
      })
    });

    expect(await router.resolve({
      path: "/api/33/followings",
      httpMethod: "PATCH",
      queryStringParameters: { testId: "12345" }
    } as any, { timeout: 10000 })).to.deep.eq({
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        testId: 12345,
        userId: 33,
      })
    });
  });
});

describe("Calling complex API", () => {
  it("should pass paramseters to child namespaces", async () => {
    const befores: any[] = [];
    const routes: Routes = [
      new Namespace("/a/:a", {
        params: {
          a: Joi.number()
        },
        async before() {
          befores.push({ a: this.params.a });
          this.params.foo = { a: this.params.a };
        },
        children: [
          new Namespace("/b/:b", {
            params: {
              b: Joi.number(),
            },
            async before() {
              befores.push({ a: this.params.a, b: this.params.b });
              this.params.bar = { a: this.params.a, b: this.params.b };
            },
            children: [
              Route.GET("/", { operationId: "get" }, {}, async function() {
                return this.json([
                  this.params.foo,
                  this.params.bar,
                ]);
              }),
            ]
          })
        ]
      })
    ];

    const router = new Router(routes);
    const res = await router.resolve({
      path: "/a/10/b/20",
      httpMethod: "GET"
    } as any, { timeout: 10000 });

    expect(res.statusCode).to.be.eq(200);
    expect(befores).to.deep.eq([
      {
        a: 10,
      }, {
        a: 10,
        b: 20,
      }
    ]);
    expect(JSON.parse(res.body)).to.be.deep.eq([
      {
        a: 10,
      }, {
        a: 10,
        b: 20,
      }
    ]);
  });
});

describe("Global Error Handling", () => {
  it("should fail, and handled by parent namespace error handler", async () => {
    const routes: Routes = [
      new Namespace("/api", {
        async exceptionHandler(error: any) {
          if (error.name === "ValidationError") {
            const validationError = error as Joi.ValidationError;
            return this.json(
              {
                errors: validationError.details.map(e => e.message),
              },
              422
            );
          }
        },
        children: [
          new Namespace("/users/:userId", {
            children: [
              Route.GET("/", { operationId: "getUser" }, {
                testId: Parameter.Query(Joi.number()),
                otherError: Parameter.Query(Joi.number()),
              }, async function() {
                const userId = this.params.userId as number;
                const testId = this.params.testId as number;
                return this.json({
                  testId,
                  userId,
                });
              })
            ]
          })
        ]
      })
    ];

    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/users/12345",
      httpMethod: "GET",
      queryStringParameters: {
      }
    } as any, { timeout: 10000 });

    expect(res).to.deep.eq({
      statusCode: 422,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ errors: [ '"testId" is required', '"otherError" is required' ] }),
    });
  });
});
