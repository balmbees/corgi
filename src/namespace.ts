import { RoutingContext } from './routing-context';
import { Route } from './route';
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

  validateParams(params: { [key: string]: string }) {
    return Joi.validate(
      params,
      Joi.object().keys(this.params),
      { stripUnknown: true },
    );
  }
}

export interface NamespaceOptions {
  before?: (this: RoutingContext) => Promise<void>;
  params?: Joi.SchemaMap;
  children: Routes;
}

export type Routes = Array<Namespace | Route>;