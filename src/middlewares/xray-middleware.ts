import { Middleware } from '../middleware';
import { RoutingContext } from '../routing-context';
import { Response } from '../lambda-proxy';

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
   * except first (n) requets, how much requetss will be sampled (0 ~ 1)
   */
  rate: number;

  /**
   * Description about this rule
   */
  description?: string;
  /**
   * Service Name filter. check segement's service name
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

export class XRayMiddleware implements Middleware {
  private segment: AWSXRaySegment | undefined;

  constructor(samplingRules: SamplingRules | undefined) {
    if (samplingRules) {
      AWSXRay.setSamplingRules(samplingRules);
    }
  }

  // runs before the application, if it returns Promise<Response>, Routes are ignored and return the response
  async before(routingContext: RoutingContext): Promise<Response | void> {
    const vingleTraceId = routingContext.headers['x-vingle-trace-id']
    if (vingleTraceId) {
      const parentSeg = AWSXRay.resolveSegment(undefined);
      this.segment = parentSeg.addNewSubsegment("corgi-route") as AWSXRaySegment;
      this.segment.addAnnotation("vingle_trace_id", vingleTraceId);
    } else {
      this.segment = undefined;
    }
  }

  // runs after the application, should return response
  async after(routingContext: RoutingContext, response: Response): Promise<Response> {
    if (this.segment) {
      this.segment.close();
    }
    this.segment = undefined;

    return response;
  }
}