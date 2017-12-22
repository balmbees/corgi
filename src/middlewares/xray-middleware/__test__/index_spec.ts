import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { XRayMiddleware } from "../index";


describe(XRayMiddleware.name, () => {
  describe("Constructor", () => {
    it("should be construted", () => {
      const middleware = new XRayMiddleware();
      expect(middleware).to.be.instanceOf(XRayMiddleware);
    });

    it("should be construted", () => {
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
});