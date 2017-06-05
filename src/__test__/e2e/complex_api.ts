import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
} from '../../index';


import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

export const routes: Routes = [
  new Namespace('/api/:userId', {
    children: [
      new Route('/followers', 'GET', 'List of users that following me', async function(this: RoutingContext) {
        return this.json({
          data: {}
        })
      }),
      new Namespace('/followings', {
        before: async function(this: RoutingContext) {
        },
        children: [
          new Route('/', 'POST', '', async function(this: RoutingContext) {
            const userId = Number(this.params.userId);
            return this.json({ userId: userId });
          }),
          new Route('/', 'DELETE', '', async function(this: RoutingContext) {
            const userId = Number(this.params.userId);
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
      headers: {
      },
      queryStringParameters: {},
      pathParameters: {},
      stageVariables: {},
      // body?: string;
    });

    chai.expect(res).to.deep.eq({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '{"userId":33}'
    });
  });
});

