import { Middleware, MiddlewareBeforeOptions, MiddlewareAfterOptions } from '../../middleware';
import { Response } from '../../lambda-proxy';

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
    const vingleTraceId = options.routingContext.headers['x-vingle-trace-id']
    if (vingleTraceId) {
      const parentSeg = AWSXRay.resolveSegment(undefined);
      this.segment = parentSeg.addNewSubsegment("corgi-route") as AWSXRaySegment;
      this.segment.addAnnotation("vingle_trace_id", vingleTraceId);
      this.segment.addAnnotation("path", options.routingContext.request.path);
      this.segment.addAnnotation("method", options.routingContext.request.httpMethod);
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
}
