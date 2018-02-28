import { EntityPresenterFactory } from "../route_factories/presenter_route";

// setup
beforeEach(() => {
  (EntityPresenterFactory as any).__schemas = undefined;
});
