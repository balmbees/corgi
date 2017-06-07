import { RoutingContext } from '../routing-context';
import { Parameter } from '../parameter';
import * as Joi from 'joi';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("RoutingContext", () => {
  describe("#validateAndUpdateParams", () => {
    it("should parse and validate JsonBody params", () => {
      const context = new RoutingContext({
        path: "/api/33/followings",
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
        }
      } as any, {
        userId: "33"
      });

      context.validateAndUpdateParams({
        testId: Parameter.Query(Joi.number()),
        update: Parameter.Body(Joi.object({
          fieldA: Joi.number(),
          fieldC: Joi.object({
            c: Joi.number()
          })
        })),
        userId: Parameter.Path(Joi.number())
      });

      expect(context.params).to.deep.eq({
        testId: 12345,
        update: {
          fieldA: 12345,
          fieldC: {
            c: 100,
          }
        },
        userId: 33,
      })
    });
  });
});

