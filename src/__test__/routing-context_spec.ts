import { expect } from "chai";

import { RoutingContext } from '../routing-context';
import { Parameter } from '../parameter';
import * as Joi from 'joi';
import * as qs from "qs";

describe("RoutingContext", () => {
  describe("#validateAndUpdateParams", () => {
    context("when body is valid JSON", () => {
      it("should parse and validate JsonBody params", () => {
        const context = new RoutingContext({} as any, {
          path: "/api/33/followings/%ED%94%BD%EC%8B%9C",
          httpMethod: 'POST',
          body: JSON.stringify({
            update: {
              fieldA: 12345,
              fieldB: 54321,
              fieldC: {
                c: 100,
              }
            }
          }),
          queryStringParameters: {
            testId: "12345",
            not_allowed_param: "xxx",
            encodedParam: "%ED%94%BD%EC%8B%9C",
            "arrayParameter[0]": "1",
            "arrayParameter[1]": "2",
            "arrayParameter[2]": "3",
            "arrayParameter[3]": "4",
          }
        } as any, "request-id", {
          userId: "33",
          interest: "%ED%94%BD%EC%8B%9C",
        });

        context.validateAndUpdateParams({
          testId: Parameter.Query(Joi.number()),
          encodedParam: Parameter.Query(Joi.string()),
          update: Parameter.Body(Joi.object({
            fieldA: Joi.number(),
            fieldC: Joi.object({
              c: Joi.number()
            })
          })),
          userId: Parameter.Path(Joi.number()),
          interest: Parameter.Path(Joi.string().strict()),
          arrayParameter: Parameter.Query(Joi.array().items(Joi.number().integer())),
        });

        expect(context.params).to.deep.eq({
          testId: 12345,
          encodedParam: "픽시",
          update: {
            fieldA: 12345,
            fieldC: {
              c: 100,
            }
          },
          userId: 33,
          interest: "픽시",
          arrayParameter: [1, 2, 3, 4],
        })
      });

      it("should parse and validate application/x-www-form-urlencoded params", () => {
        const context = new RoutingContext({} as any, {
          path: "/api/33/followings/%ED%94%BD%EC%8B%9C",
          httpMethod: 'POST',
          body: qs.stringify({
            update: {
              fieldA: 12345,
              fieldB: 54321,
              fieldC: {
                c: 100,
              }
            }
          }),
          headers: {
            'Content-Type': "application/x-www-form-urlencoded",
          },
          queryStringParameters: {
            testId: "12345",
            not_allowed_param: "xxx",
            encodedParam: "%ED%94%BD%EC%8B%9C",
            "arrayParameter[0]": "1",
            "arrayParameter[1]": "2",
            "arrayParameter[2]": "3",
            "arrayParameter[3]": "4",
          }
        } as any, "request-id", {
            userId: "33",
            interest: "%ED%94%BD%EC%8B%9C",
          });

        context.validateAndUpdateParams({
          testId: Parameter.Query(Joi.number()),
          encodedParam: Parameter.Query(Joi.string()),
          update: Parameter.Body(Joi.object({
            fieldA: Joi.number(),
            fieldC: Joi.object({
              c: Joi.number()
            })
          })),
          userId: Parameter.Path(Joi.number()),
          interest: Parameter.Path(Joi.string().strict()),
          arrayParameter: Parameter.Query(Joi.array().items(Joi.number().integer())),
        });

        expect(context.params).to.deep.eq({
          testId: 12345,
          encodedParam: "픽시",
          update: {
            fieldA: 12345,
            fieldC: {
              c: 100,
            }
          },
          userId: 33,
          interest: "픽시",
          arrayParameter: [1, 2, 3, 4],
        })
      });

      it("should parse and validate JsonBody params when path has % character", () => {
        const context = new RoutingContext({} as any, {
          path: "/api/33/followings/100%users",
          httpMethod: 'POST',
          body: JSON.stringify({
            update: {
              fieldA: 12345,
              fieldB: 54321,
              fieldC: {
                c: 100,
              }
            }
          }),
          queryStringParameters: {
            testId: "12345",
            not_allowed_param: "xxx",
            encodedParam: "100%users",
            "arrayParameter[0]": "1",
            "arrayParameter[1]": "2",
            "arrayParameter[2]": "3",
            "arrayParameter[3]": "4",
          }
        } as any, "request-id", {
          userId: "33",
          interest: "100%users",
        });

        context.validateAndUpdateParams({
          testId: Parameter.Query(Joi.number()),
          encodedParam: Parameter.Query(Joi.string()),
          update: Parameter.Body(Joi.object({
            fieldA: Joi.number(),
            fieldC: Joi.object({
              c: Joi.number()
            })
          })),
          userId: Parameter.Path(Joi.number()),
          interest: Parameter.Path(Joi.string().strict()),
          arrayParameter: Parameter.Query(Joi.array().items(Joi.number().integer())),
        });

        expect(context.params).to.deep.eq({
          testId: 12345,
          encodedParam: "100%users",
          update: {
            fieldA: 12345,
            fieldC: {
              c: 100,
            }
          },
          userId: 33,
          interest: "100%users",
          arrayParameter: [1, 2, 3, 4],
        })
      });
    });

    context("when body is null (which means empty request body)", () => {
      it("should parse and validate JsonBody params", () => {
        const context = new RoutingContext({} as any, {
          path: "/api/33/followings/%ED%94%BD%EC%8B%9C",
          httpMethod: 'POST',
          body: null,
          queryStringParameters: null,
        } as any, "request-id", {
          userId: "33",
          interest: "%ED%94%BD%EC%8B%9C",
        });

        context.validateAndUpdateParams({
          update: Parameter.Body(Joi.object({
            complex: Joi.array().items(Joi.number()).allow(null),
          }).optional().default({ complex: null })),
        });

        expect(context.params).to.deep.eq({
          update: {
            complex: null,
          },
        });
      });
    });
  });

  describe("#normalizeHeaders", () => {
    it("should normalize headers", () => {
      const context = new RoutingContext({} as any, {
        path: "/api/33/followings",
        httpMethod: 'POST',
        body: JSON.stringify({ foo: 'bar' }),
        headers: {
          'origin': 'https://bar.baz',
          'User-Agent': 'Googlebot/1.0',
        },
        queryStringParameters: null,
      } as any, "request-id", {});

      expect(context.headers).to.be.deep.eq({
        'origin': 'https://bar.baz',
        'user-agent': 'Googlebot/1.0',
      });
    });

    it("should be called lazily / should be cached", () => {
      const context = new RoutingContext({} as any, {
        path: "/api/wow/awesome",
        httpMethod: 'POST',
        body: JSON.stringify({ such: 'value' }),
        headers: {
          'ETag': 'abcdef',
          'Host': 'www.vingle.net',
        },
        queryStringParameters: null,
      } as any, "request-id", {});


      // HACK: setup trap for testing call count
      let callCount = 0;
      // backup original function reference
      const fn = (context as any).normalizeHeaders;

      const noop = (() => {}) as any;

      // decorate target method to trap method calls
      (context as any).normalizeHeaders = function () {
        callCount++;
        return fn.apply(context, arguments);
      };

      // normalizeHeaders should be called lazily
      expect(callCount).to.be.eq(0);

      noop(context.headers);
      expect(callCount).to.be.eq(1);

      // ... and should be cached
      noop(context.headers);
      noop(context.headers);
      noop(context.headers);
      expect(callCount).to.be.eq(1);

      expect(context.headers).to.be.deep.eq({
        'etag': 'abcdef',
        'host': 'www.vingle.net',
      });
      expect(callCount).to.be.eq(1);
    });
  });
});

