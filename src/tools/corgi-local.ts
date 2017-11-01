// tslint:disable

import * as BbPromise from "bluebird";
import * as debug from "debug";
import * as http from "http";
import * as URL from "url";

import * as LambdaProxy from "../lambda-proxy";

const micro = require("micro"); // tslint:disable-line

export function createServer(
  handler: (event: LambdaProxy.Event, context: LambdaProxy.Context) => void,
  options: {
    verbose?: boolean,
    timeout?: number,
  } = {},
): http.Server {
  const LOG_TAG = "corgi-local";
  const log = debug(LOG_TAG);

  if (options.verbose) {
    log.enabled = true;
  }

  return micro(async function(req: http.IncomingMessage, res: http.ServerResponse) {
    log(`${req.method} ${req.url}`);

    const url = URL.parse(req.url!, true);
    const body = await micro.text(req);

    const response = await new BbPromise<LambdaProxy.Response>((resolve, reject) => {
      handler({
        resource: "Corgi-Simulator",
        path: url.pathname,
        httpMethod: req.method,
        headers: req.headers,
        queryStringParameters: url.query,
        requestContext: {
          resourceId: "request-random-id",
        },
        body,
      } as any, {
        functionName: "some name",
        functionVersion: "v1.0",
        invokedFunctionArn: "arn",
        memoryLimitInMB: 1024,
        awsRequestId: "random id",
        logGroupName: "log group",
        logStreamName: "log stream",
        succeed: (handlerResponse: LambdaProxy.Response) => {
          resolve(handlerResponse);
        },
        fail: (e: Error) => {
          reject(e);
        },
        done: (e: Error, handlerResponse: LambdaProxy.Response) => {
          if (e) {
            return reject(e);
          }

          resolve(handlerResponse);
        },
        getRemainingTimeInMillis: () => options.timeout || 30 * 1000,
      } as any);
    });

    // set headers if specified
    const headers = transformResponseHeaders(response.headers || {});
    Object.keys(headers).forEach((fieldName) => {
      const value = headers[fieldName];

      res.setHeader(fieldName, value);
    });

    micro.send(res, response.statusCode, response.body);
  });
}

function transformResponseHeaders(headers: { [fieldName: string]: string }) {
  return Object.keys(headers)
    .reduce((hash, fieldName) => {
      const groupKey = fieldName.toLowerCase();
      const value = headers[fieldName];

      if (!hash[groupKey]) {
        hash[groupKey] = value;

        return hash;
      }

      if (typeof hash[groupKey] === "string") {
        const oldValue = hash[groupKey] as string;

        hash[groupKey] = [ oldValue, value ];
        return hash;
      }

      if (hash[groupKey] instanceof Array) {
        const oldValue = hash[groupKey] as string[];
        oldValue.push(value);

        return hash;
      }

      return hash;
    }, {} as { [fieldName: string]: string | string[] });
}
