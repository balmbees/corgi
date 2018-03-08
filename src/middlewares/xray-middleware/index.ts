import { Middleware, MiddlewareBeforeOptions, MiddlewareAfterOptions } from '../../middleware';
import { RoutingContext } from '../../routing-context';
import { Response, Event as LambdaProxyEvent } from '../../lambda-proxy';
import * as http from 'http';

const AWSXRay = require("aws-xray-sdk-core");
interface AWSXRaySegment {
  addAnnotation(name: string, value: string): void;
  close(error?: Error): void;
}

export interface SamplingRules {
  rules?: SamplingRules[];
  default: SamplingRule;
  /**
   * Number identifier of version. just (1)
   */
  version: number;
}

export interface SamplingRule {
  /**
   * first (n) request for every seconds will be profiled
   */
  fixed_target: number;
  /**
   * except first (n) requests, how much requests will be sampled (0 ~ 1)
   */
  rate: number;

  /**
   * Description about this rule
   */
  description?: string;
  /**
   * Service Name filter. check segment's service name
   */
  service_name?: string;
  /**
   * HTTP Method filter, check segment's http_method
   */
  http_method?: string;
  /**
   * URL Path filter, check segment's url_path
   */
  url_path?: string;
}

export class XRayMiddleware extends Middleware {
  private segment: AWSXRaySegment | undefined;
  constructor(samplingRules?: SamplingRules) {
    super();
    if (samplingRules) {
      AWSXRay.middleware.setSamplingRules(samplingRules);
    }
  }

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  async before(options: MiddlewareBeforeOptions<undefined>): Promise<Response | void> {
    AWSXRay.middleware.IncomingRequestData(this.getIncomingRequestData(options.routingContext.request));
    const vingleTraceId = options.routingContext.headers['x-vingle-trace-id']
    if (vingleTraceId) {
      const parentSeg = AWSXRay.resolveSegment(undefined);
      this.segment = parentSeg.addNewSubsegment("corgi-route") as AWSXRaySegment;
      this.segment.addAnnotation("vingle_trace_id", vingleTraceId);
      this.segment.addAnnotation("operation_id", options.currentRoute.operationId || "");
    } else {
      this.segment = undefined;
    }
  }

  // runs after the application, should return response
  async after(options: MiddlewareAfterOptions<undefined>): Promise<Response> {
    if (this.segment) {
      this.segment.close();
    }
    this.segment = undefined;

    return options.response;
  }

  private getIncomingRequestData(event: LambdaProxyEvent): http.IncomingMessage {
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/13909
    // @ts-ignore: http.IncomingMessage is a type, not a class in Typescript
    const msg: http.IncomingMessage = new http.IncomingMessage();

    msg.method = event.httpMethod;
    msg.url = event.path;
    msg.headers = event.headers;
    return msg;
  }
}
