import { RoutingContext } from "../routing-context";
import {
  HttpMethod,
  Route,
  RouteHandler,
  RouteSimplifiedOptions,
} from "../route";
import {
  ParameterDefinitionMap,
} from "../parameter";

export interface Presenter<Input, Output> {
  readonly outputJSONSchema: any; // JSON Schema of return type;
  readonly present: (input: Input) => Output;
}

import * as Joi from "joi";
export class DataLayout<Input, Output> implements Presenter<Input, { data: Output }> {
  public outputJSONSchema = Joi.object({
    data: Joi.array().items(this.presenter.outputJSONSchema)
  });

  constructor(private presenter: Presenter<Input, Output>) { }

  public present(input: Input) {
    const output = this.presenter.present(input);
    return {
      data: output,
    };
  }
}

export type PresenterRouteHandler<Input> = (this: RoutingContext) => Promise<Input>;
export class PresenterRouteFactory {
  static create<Input, Output>(
    path: string,
    method: HttpMethod,
    options: RouteSimplifiedOptions,
    params: ParameterDefinitionMap,
    handler: PresenterRouteHandler<Input>,
    presenter: Presenter<Input, Output>
  ): Route {
    return new Route({
      path,
      method,
      desc: options.desc,
      responses: Object.assign(options.responses || {}, {
        200: {
          desc: "Success",
          schema: presenter.outputJSONSchema,
        },
      }),
      metadata: options.metadata,
      params,
      handler: async function () {
        const res = (await (handler.call(this) as Promise<Input>));
        return this.json(presenter.present(res));
      },
    });
  }
}