import {
  CacheMiddleware,
  CacheMiddlewareMetadata,
  CacheStore
} from "../../cache-middleware";
import {
  Route,
  RoutingContext,
  Namespace,
  Routes,
  Router,
  Parameter,
} from '../../../index';
import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;


class MemoryStore implements CacheStore {
  private store: { [key: string]: string } = {};

  public async set(key: string, value: string, expiresIn: number) {
    console.log("MemoryStore set : ", key, value);
    this.store[key] = value;
  }

  public async get(key: string) {
    console.log("MemoryStore get", key, this.store[key]);
    return this.store[key];
  }

  public async delete(key: string) {
    console.log("MemoryStore delete", key);
    delete this.store[key];
    console.log(this.store);
    return true;
  }
}

describe('CacheMiddleware', () => {
  describe("#cacheKey", () => {
    it("should generate key", () => {
      const middleware = new CacheMiddleware("CacheTestService", new MemoryStore());
      // const cacheKey = middleware.cacheKey()
    });
  });

  it("should work", async () => {
    const user = {
      username: "kurt",
    };

    const routes: Routes = [
      new Namespace('/api/users/:userId', {
        params: {
          userId: Joi.number()
        },
        children: [
          Route.GET('/', {
            operationId: 'GetUser',
            middlewares: {
              cache: new CacheMiddlewareMetadata(360),
            }
          }, {}, async function() {
            return this.json({
              user,
            })
          }),
          Route.PUT('/', { operationId: 'DeleteUser' }, { username: Parameter.Body(Joi.string()) }, async function () {
            user.username = this.params.username;

            // Clear Cache
            (this.router.findMiddleware(CacheMiddleware) as CacheMiddleware).deleteCache('GetUser', { userId: this.params.userId });

            return this.json({});
          }),
        ]
      })
    ];
    const router = new Router(
      routes,
      {
        middlewares: [
          new CacheMiddleware("CacheTestService", new MemoryStore()),
        ]
      }
    );


    // First time, showing 0 and cached
    expect(JSON.parse((await router.resolve({
      path: "/api/users/1234", httpMethod: 'GET', body: '{}',
    } as any)).body)).to.deep.eq({
      user: { username: 'kurt' }
    });

    // eventhough i change the value by force,
    user.username = "ABC";

    // response it served from cache
    expect(JSON.parse((await router.resolve({
      path: "/api/users/1234", httpMethod: 'GET', body: '{}',
    } as any)).body)).to.deep.eq({
      user: { username: 'kurt' }
    });

    // but if i actually change the name by API
    await router.resolve({
      path: "/api/users/1234", httpMethod: 'PUT', body: JSON.stringify({ username: 'Cobain' }),
    } as any);

    // cache renewd, so new data
    expect(JSON.parse((await router.resolve({
      path: "/api/users/1234", httpMethod: 'GET', body: '{}',
    } as any)).body)).to.deep.eq({
      user: { username: 'Cobain' }
    });
  });
});

