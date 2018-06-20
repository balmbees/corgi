import { expect } from "chai";

import { Route } from '../route';
import { Router } from '../router';
import { RootNamespace, StandardError } from '../root-namespace';

class CustomError extends Error {

}

describe("RootNamespace", () => {
  describe("#exceptionHandler", () => {
    context("with custom error", () => {
      it("should handler general error and build json response", async () => {
        const rootNamespace = new RootNamespace([
          Route.GET('/test', { operationId: "test" }, {}, async function() {
            throw new CustomError("TEST ERROR");
          })
        ]);

        const router = new Router([rootNamespace]);
        const res = await router.resolve({
          path: '/test',
          httpMethod: 'GET',
        } as any, { requestId: "request-id", timeout: 10000 });

        expect(JSON.parse(res["body"])).to.deep.eq({
          'error':{
            'id':'request-id',
            'code': 'Error',
            'message':'TEST ERROR'
          }
        });
        expect(res.statusCode).to.be.eq(500);
      });
    });

    context("with standard error", () => {
      it("should handler general error and build json response", async () => {
        const rootNamespace = new RootNamespace([
          Route.GET('/test', { operationId: "test" }, {}, async function() {
            throw new StandardError(422, {
              code: "INVALID_REQUEST", message: "this request is invalid", metadata: { test: 1 }
            });
          })
        ]);

        const router = new Router([rootNamespace]);
        const res = await router.resolve({
          path: '/test',
          httpMethod: 'GET',
        } as any, { requestId: "request-id", timeout: 10000 });

        expect(JSON.parse(res["body"])).to.deep.eq({
          'error':{
            'id': 'request-id',
            'code': 'INVALID_REQUEST',
            'message': 'this request is invalid',
            'metadata': {
              'test': 1,
            },
          }
        });
        expect(res.statusCode).to.be.eq(422);
      });
    });
  });
});

