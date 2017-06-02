export interface Event {
  resource?: string;
  path: string;
  httpMethod: string;
  headers: EventHeaders;
  queryStringParameters: EventQueryStringParameters;
  pathParameters?: EventPathParameters;
  stageVariables?: EventStageVariables;
  requestContext?: {
    "accountId": string;
    "resourceId": string;
    "stage": string;
    "requestId": string;
    "identity": {
      "cognitoIdentityPoolId": any;
      "accountId": any;
      "cognitoIdentityId": any;
      "caller": any;
      "apiKey": any;
      "sourceIp": string,
      "accessKey": any;
      "cognitoAuthenticationType": any;
      "cognitoAuthenticationProvider": any;
      "userArn": any;
      "userAgent": string;
      "user": any;
    }
    "resourcePath": string;
    "httpMethod": string;
    "apiId": string;
  };
  body?: string;
}

export interface EventHeaders {
  "Accept"?: string;
  "Accept-Encoding"?: string;
  "Accept-Language"?: string;
  "CloudFront-Forwarded-Proto"?: string;
  "CloudFront-Is-Desktop-Viewer"?: string;
  "CloudFront-Is-Mobile-Viewer"?: string;
  "CloudFront-Is-SmartTV-Viewer"?: string;
  "CloudFront-Is-Tablet-Viewer"?: string;
  "CloudFront-Viewer-Country"?: string;
  "Host"?: string;
  "Upgrade-Insecure-Requests"?: string;
  "User-Agent"?: string;
  "Via"?: string;
  "X-Amz-Cf-Id"?: string;
  "X-Forwarded-For"?: string;
  "X-Forwarded-Port"?: string;
  "X-Forwarded-Proto"?: string;
  "original-uri"?: string;
}

export interface EventQueryStringParameters {
  [key: string]: string;
}

export interface EventPathParameters {
  [key: string]: string;
}

export interface EventStageVariables {
  [key: string]: string;
}


// Response
export interface Response {
  statusCode: number;
  headers: {
    'Content-Type': string
  };
  body: string;
}

export interface Context {
    // Properties
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: number;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    identity?: CognitoIdentity;
    clientContext?: ClientContext;

    // Functions
    succeed(result?: Object): void;
    fail(error: Error): void;
    done(error: Error | null, result?: Response): void; // result must be JSON.stringifyable
    getRemainingTimeInMillis(): number;
}

export interface CognitoIdentity {
    cognito_identity_id: string;
    cognito_identity_pool_id: string;
}

export interface ClientContext {
    client: ClientContextClient;
    Custom?: any;
    env: ClientContextEnv;
}

export interface ClientContextClient {
    installation_id: string;
    app_title: string;
    app_version_name: string;
    app_version_code: string;
    app_package_name: string;
}

export interface ClientContextEnv {
    platform_version: string;
    platform: string;
    make: string;
    model: string;
    locale: string;
}
