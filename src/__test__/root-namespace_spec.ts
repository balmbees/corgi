import { expect } from "chai";

import { Route } from '../route';
import { Router } from '../router';
import { StandardError } from "../error_response";
import { RootNamespace } from '../root-namespace';

class CustomError extends Error {

}

describe("RootNamespace", () => {
  describe("#exceptionHandler", () => {
    context("with custom error", () => {
      let rootNamespace: RootNamespace;
      const subject = async () => {
        rootNamespace = new RootNamespace([
          Route.GET('/test', { operationId: "test" }, {}, async function () {
            throw new CustomError("TEST ERROR");
          })
        ]);

        const router = new Router([rootNamespace]);
        return await router.resolve({
          path: '/test',
          httpMethod: 'GET',
        } as any, { requestId: "request-id", timeout: 10000 });
      };

      context("with CORGI_ERROR_PASSSWORD", () => {
        beforeEach(() => {
          process.env.CORGI_ERROR_PASSSWORD = "password";
        });

        it("should handler general error and build json response, with encrpyted message", async () => {
          const res = await subject();
          expect(
            rootNamespace.errorFormatter.decryptErrorMetadata(JSON.parse(res["body"]).error.metadata)
          ).to.be.deep.eq({
            "message": "TEST ERROR",
            "name": "Error",
            "stack": [
              "Error: TEST ERROR",
              "    at RoutingContext.<anonymous> (/Users/lea/Works/corgi/dst/__test__/root-namespace_spec.js:26:35)",
              "    at Generator.next (<anonymous>)",
              "    at /Users/lea/Works/corgi/dst/__test__/root-namespace_spec.js:7:71",
              "    at new WrappedPromise (/Users/lea/Works/corgi/node_modules/async-listener/es6-wrapped-promise.js:13:18)",
              "    at __awaiter (/Users/lea/Works/corgi/dst/__test__/root-namespace_spec.js:3:12)",
              "    at RoutingContext.<anonymous> (/Users/lea/Works/corgi/dst/__test__/root-namespace_spec.js:25:32)",
              "    at Router.<anonymous> (/Users/lea/Works/corgi/dst/router.js:148:51)",
              "    at Generator.next (<anonymous>)",
              "    at /Users/lea/Works/corgi/dst/router.js:7:71",
              "    at new WrappedPromise (/Users/lea/Works/corgi/node_modules/async-listener/es6-wrapped-promise.js:13:18)",
              "    at __awaiter (/Users/lea/Works/corgi/dst/router.js:3:12)",
              "    at runRoute (/Users/lea/Works/corgi/dst/router.js:121:65)",
              "    at /Users/lea/Works/corgi/dst/router.js:207:60",
              "    at Generator.next (<anonymous>)",
              "    at fulfilled (/Users/lea/Works/corgi/dst/router.js:4:58)",
              "    at propagateAslWrapper (/Users/lea/Works/corgi/node_modules/async-listener/index.js:502:23)",
              "    at /Users/lea/Works/corgi/node_modules/async-listener/glue.js:188:31",
              "    at /Users/lea/Works/corgi/node_modules/async-listener/index.js:539:70",
              "    at /Users/lea/Works/corgi/node_modules/async-listener/glue.js:188:31",
              "    at <anonymous>",
              "    at process._tickCallback (internal/process/next_tick.js:188:7)",
            ]
          });
          expect(res.statusCode).to.be.eq(500);
        });
      });

      context("without CORGI_ERROR_PASSSWORD", () => {
        beforeEach(() => {
          delete process.env.CORGI_ERROR_PASSSWORD;
        });

        it("should handler general error and build json response", async () => {
          const res = await subject();

          expect(JSON.parse(res["body"])).to.deep.eq({
            'error': {
              'id': 'request-id',
              'code': 'Error',
              'message': 'TEST ERROR'
            }
          });
          expect(res.statusCode).to.be.eq(500);
        });
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

