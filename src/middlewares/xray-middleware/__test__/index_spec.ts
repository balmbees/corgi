import { expect } from "chai";

import { Route } from "../../../route";
import { RoutingContext } from "../../../routing-context";
import { XRayMiddleware } from "../index";

describe(XRayMiddleware.name, () => {
  describe("Constructor", () => {
    it("should be constructed", () => {
      const middleware = new XRayMiddleware();
      expect(middleware).to.be.instanceOf(XRayMiddleware);
    });

    it("should be constructed", () => {
      const middleware = new XRayMiddleware({
        default: {
          fixed_target: 2,
          rate: 0.01,
        },
        version: 1,
      });
      expect(middleware).to.be.instanceOf(XRayMiddleware);
    });
  });

  describe("before", () => {
    it("should execute before", async () => {
      const middleware = new XRayMiddleware();
      await middleware.before({
        routingContext: new RoutingContext({} as any, {} as any, "", {}),
        currentRoute: new Route({
          path: "/foo",
          method: "GET",
          operationId: "gotFoo",
          desc: "foo",
          async handler() {
            return this.json({});
          },
        }),
      });
    });
  });
});
