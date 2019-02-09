import { expect } from "chai";

import { Namespace } from "../namespace";
import { Route } from "../route";

describe("Namespace", () => {
  describe("#constructor", () => {
    it("should construct object with given options", () => {
      const namespace  =
        new Namespace("/api", {
          children: [
            Route.GET("/test", { operationId: "test" }, {}, async function() {
              return this.json({});
            })
          ]
        });

      expect(namespace).to.be.instanceof(Namespace);
      expect(namespace.path).to.deep.eq("/api");
    });

    it("should raise error when there is no child", () => {
      expect(function() {
        return new Namespace("/api", { children: [] });
      }).to.throw(Error);
    });
  });
});
