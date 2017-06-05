import { RoutingContext } from './routing-context';
import { Route } from './route';
import { Response } from './lambda-proxy';
import * as Joi from 'joi';

// ---- Namespace
export class Namespace {
  private _path: string;
  constructor(
    path: string,
    private options: NamespaceOptions
  ) {
    this._path = path;
    if (options.children.length == 0) {
      throw new Error('Namespace must have childrens');
    }
  }

  get before() { return this.options.before; }
  get children() { return this.options.children; }
  get path() { return this._path; }
  get params() { return this.options.params; }
  get exceptionHandler() { return this.options.exceptionHandler; }
}

// if it's void, it's failed to handler error
export type ExceptionHandler = (this: RoutingContext, error: any) => Promise<Response | void>;

export interface NamespaceOptions {
  before?: (this: RoutingContext) => Promise<void>;
  exceptionHandler?: ExceptionHandler;
  params?: Joi.SchemaMap;
  children: Routes;
}

export type Routes = Array<Namespace | Route>;