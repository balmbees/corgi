import { Middleware } from '../middleware';
import { RoutingContext } from '../routing-context';
import { Response } from '../lambda-proxy';

const AWSXRay = require("aws-xray-sdk-core");
interface AWSXRaySegment {
  addAnnotation(name: string, value: string): void;
  close(error?: Error): void;
}

export class XRayMiddleware implements Middleware {
  private segment: AWSXRaySegment | undefined;

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