import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { PresenterRouteFactory } from "../presenter_route";

describe(PresenterRouteFactory.name, () => {
  describe("#create", () => {
    it("should create route that using given presenter", async () => {
      const presenter = {
        outputJSONSchema: {},
        present(input: { x: number }) {
          return {
            xxxx: input.x
          };
        }
      };
      const route = PresenterRouteFactory.create(
        "/api",
        "GET", {
          desc: "test", operationId: "getAPI"
        }, {
        }, async () => {
          return { x: 100 }
        },
        presenter,
      );
    });
  });
});