import { CacheStore } from "./cache-middleware";

// TODO made this part as an seperated NPM module
import { Memcached } from "memcached-typed";

export class MemcachedCacheStore implements CacheStore {
  private client: Memcached<string>;
  constructor(memcachedURL: string) {
    this.client = new Memcached(memcachedURL, {
      reconnect: 1000,
      timeout: 1000,
      retries: 3,
      failures: 3,
      retry: 1000,
      remove: true,
      idle: 1000
    });
  }

  async get(key: string) {
    try {
      return await this.client.get(key);
    } catch (e) {
      // it's possible to memcached is dead. so..
      return undefined;
    }
  }
  async set(key: string, value: string, expiresIn: number) {
    try {
      await this.client.set(key, value, expiresIn);
    } catch (e) {
      // it's possible to memcached is dead. so..
    }
  }

  async delete(key: string) {
    try {
      return await this.client.del(key);
    } catch (e) {
      return false;
      // it's possible to memcached is dead. so..
    }
  }
}