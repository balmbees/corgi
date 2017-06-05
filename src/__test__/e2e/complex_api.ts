import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
} from '../../index';
import * as Joi from 'joi';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

export const routes: Routes = [
  new Namespace('/api/:userId', {
    params: {
      userId: Joi.number()
    },
    children: [
      new Route({
        path: '/followers',
        method: 'GET',
        desc: 'List of users that following me',
        handler: async function(this: RoutingContext) {
          return this.json({
            data: {}
          })
        }}
      ),
      new Namespace('/followings', {
        before: async function(this: RoutingContext) {
        },
        children: [
          Route.POST('/', '', {
            test_id: Joi.number()
          }, async function(this: RoutingContext) {
            const userId = this.params.userId as number;
            const testId = this.params.test_id as number;
            return this.json({
              testId,
              userId,
            });
          }),
          Route.DELETE('/', '', {}, async function(this: RoutingContext) {
            const userId = this.params.userId as number;
            return this.json({ userId: userId });
          }),
        ]
      })
    ]
  })
];

describe("Calling complex API", () => {
  it("should exist", async () => {
    const router = new Router(routes);
    const res = await router.resolve({
      path: "/api/33/followings",
      httpMethod: 'POST',
      queryStringParameters: {
        test_id: "12345",
        not_allowed_param: "xxx",
      }
    } as any);

    chai.expect(res).to.deep.eq({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 33,
        test_id: 12345,
      })
    });
  });
});

