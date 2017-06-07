import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
} from '../../index';
import * as Joi from 'joi';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe("Calling complex API", () => {
  it("should exist", async () => {
    const routes: Routes = [
      new Namespace('/api/:userId', {
        params: {
          userId: Joi.number()
        },
        children: [
          new Route({
            path: '/followers',
            method: 'GET',
            desc: 'List of users that following me',
            handler: async function() {
              return this.json({
                data: {}
              })
            }}
          ),
          new Namespace('/followings', {
            before: async function() {
            },
            children: [
              Route.POST('/', '', {
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
              Route.DELETE('/', '', {}, async function() {
                const userId = this.params.userId as number;
                return this.json({ userId: userId });
              }),
            ]
          })
        ]
      })
    ];

    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/33/followings",
      httpMethod: 'POST',
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
    } as any);

    chai.expect(res).to.deep.eq({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        testId: 12345,
        userId: 33,
        update: {
          fieldA: 12345,
        }
      })
    });
  });
});

describe("Global Error Handling", () => {
  it("should fail, and handled by parent namespace error handler", async () => {
    const routes: Routes = [
      new Namespace('/api', {
        exceptionHandler: async function(error: any) {
          if (error.name == 'ValidationError') {
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
          new Namespace('/users/:userId', {
            children: [
              Route.GET('/', '', {
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
      httpMethod: 'GET',
      queryStringParameters: {
      }
    } as any);

    chai.expect(res).to.deep.eq({
      statusCode: 422,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ errors: [ '"testId" is required', '"otherError" is required' ] }),
    });
  });
})
