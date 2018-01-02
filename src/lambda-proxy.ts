export interface Event {
  resource?: string;
  path: string;
  httpMethod: string;
  headers: EventHeaders;
  queryStringParameters?: EventQueryStringParameters;
  pathParameters?: EventPathParameters;
  stageVariables?: EventStageVariables;
  requestContext?: {
    accountId: string;
    resourceId: string;
    stage: string;
    requestId: string;
    identity: {
      cognitoIdentityPoolId: string;
      accountId: string;
      cognitoIdentityId: string;
      caller: string;
      apiKey: string;
      sourceIp: string,
      accessKey: string;
      cognitoAuthenticationType: string;
      cognitoAuthenticationProvider: string;
      userArn: string;
      userAgent: string;
      user: string;
    }
    resourcePath: string;
    httpMethod: string;
    apiId: string;
  };
  body?: string;
}

export interface EventHeaders {
  [key: string]: string;
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
  headers: { [key: string]: string };
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
