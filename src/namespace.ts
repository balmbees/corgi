import * as Joi from "joi";
import { Response } from "./lambda-proxy";
import { Route } from "./route";
import { RoutingContext } from "./routing-context";

// ---- Namespace
export class Namespace {
  constructor(
    public readonly path: string,
    private options: NamespaceOptions
  ) {
    if (options.children.length === 0) {
      throw new Error("Namespace must have childrens");
    }
  }

  get before() { return this.options.before; }
  get children() { return this.options.children; }
  get params() { return this.options.params; }
  get exceptionHandler() { return this.options.exceptionHandler; }
}

// if it's void, it's failed to handler error
export type ExceptionHandler = (this: RoutingContext, error: Error) => Promise<Response | void>;

export interface NamespaceOptions {
  before?: (this: RoutingContext) => Promise<void>;
  exceptionHandler?: ExceptionHandler;
  /**
   * All the params are from 'PATH'. namespace currently won't support query param validation or access
   */
  params?: { [name: string]: Joi.Schema };
  children: Routes;
}

export type Routes = Array<Namespace | Route>;
