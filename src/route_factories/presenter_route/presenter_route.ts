import { RoutingContext } from "../../routing-context";
import {
  HttpMethod,
  Route,
  RouteHandler,
  RouteSimplifiedOptions,
} from "../../route";
import {
  ParameterDefinitionMap,
} from "../../parameter";

import { Presenter } from "./presenter";

export type PresenterRouteHandler<Input> = (this: RoutingContext) => Promise<Input>;
export class PresenterRouteFactory {
  static create<Entity, Output>(
    path: string,
    method: HttpMethod,
    options: RouteSimplifiedOptions,
    params: ParameterDefinitionMap,
    presenter: Presenter<Entity, Output>,
    handler: PresenterRouteHandler<Entity>
  ): Route {
    return new Route({
      path,
      method,
      desc: options.desc,
      operationId: options.operationId,
      responses: Object.assign(options.responses || {}, {
        200: {
          desc: "Success",
          schema: presenter.outputJSONSchema(),
        },
      }),
      metadata: options.metadata,
      params,
      handler: async function () {
        const res = (await (handler.call(this) as Promise<Entity>));
        return this.json(presenter.present(res));
      },
    });
  }

  // Simplified Constructors
  static GET<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'GET', options, params, presenter, handler)
  }
  static POST<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'POST', options, params, presenter, handler)
  }
  static PUT<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'PUT', options, params, presenter, handler)
  }
  static DELETE<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'DELETE', options, params, presenter, handler)
  }
  static OPTIONS<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'OPTIONS', options, params, presenter, handler)
  }
  static HEAD<Input, Output>(path: string, options: RouteSimplifiedOptions, params: ParameterDefinitionMap, presenter: Presenter<Input, Output>, handler: PresenterRouteHandler<Input>) {
    return this.create(path, 'HEAD', options, params, presenter, handler)
  }
}