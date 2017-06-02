import { RoutingContext } from './routing-context';
import { Route } from './route';

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
}

export interface NamespaceOptions {
  before?: (this: RoutingContext) => Promise<void>;
  children: Routes;
}

export type Routes = Array<Namespace | Route>;
