// List of custom errors

import { Route } from "./route";

export class TimeoutError extends Error {
  constructor(public readonly route: Route) {
    super("Timeout Error");
  }
}
