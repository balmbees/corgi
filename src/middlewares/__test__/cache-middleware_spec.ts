import { CacheMiddleware, CacheStore } from "../cache-middleware";

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;


export class MemoryStore implements CacheStore {
  private store: { [key: string]: string } = {};

  public async set(key: string, value: string, expiresIn: number) {
    this.store[key] = value;
  }

  public async get(key: string) {
    return this.store[key];
  }

  public async delete(key: string) {
    delete this.store[key];
    return true;
  }
}

describe(CacheMiddleware.toString(), () => {
  describe("#cacheKey", () => {
    it("should generate key", () => {
      const middleware = new CacheMiddleware(new MemoryStore());
      // const cacheKey = middleware.cacheKey()
    });
  });
});

