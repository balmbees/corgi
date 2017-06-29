[![Travis Build Status](https://travis-ci.org/balmbees/corgi.svg?branch=master)](https://travis-ci.org/balmbees/corgi)
[![npm version](https://badge.fury.io/js/vingle-corgi.svg)](https://badge.fury.io/js/vingle-corgi)

# Corgi
Restful HTTP Framework for AWS Lambda - AWS API Gateway Proxy Integration

<img width="500px" height="auto" src="https://scontent-hkg3-1.cdninstagram.com/t51.2885-15/e35/13735891_1160668067329731_1019397372_n.jpg" />

## Features
1. Cascade Routing
2. Route parameter
    such as "users/:userId/followings"
3. Parameter Validation
    it uses [Joi](https://github.com/hapijs/joi)
4. Exception Handling
    refer [example](src/__test__/e2e/complex_api.ts)
5. Swagger Document Generation
    [Swagger](http://swagger.io/) is API Documentation spec. Corgi support automatic swagger document generation.
    refer [example](src/__test__/swagger_spec.ts)

Whole thing supports async/await for sure, written in typescript also

## TODO
1. HTTP Body Parser
    Base64Encoding support
2. View Framework
    should support Swagger Response schema

## Why do i need a extra Framework for Lambda?

So simple lambda handler looks like this

```js
exports.myHandler = function(event, context, callback) {
   console.log("value1 = " + event.key1);
   console.log("value2 = " + event.key2);
   callback(null, "some success message");
}
```

let's say you connected API Gateway, (using serverless maybe),
as Lambda Proxy. and wanna build some Restful API with that.

```js
exports.myHandler = function(event, context, callback) {
  if (
    event.path === '/api/someapi'
    && event.method == 'GET'
  ) {
    callback(
      null, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            response: "XXX"
          }
        })
      }
    )
  } else {
    callback(
      null, {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Not Found',
        })
      }
    )
  }
}
```

Ok, fairly good, since it's on lambda and api gateway so everything is managed and scaled....etc.
but surely, it will be really messy soon.

there are several frameworks that built for this,
(such as running express itself on lambda, eventhough which is what exactly AWS APIGateway is for)  
[lambda-req](https://www.npmjs.com/package/lambda-req)  
[aws-serverless-express](https://github.com/awslabs/aws-serverless-express)  
[serverless-express](https://claudiajs.com/tutorials/serverless-express.html)  

we did considered about using any kind of those express wrapping seriously,
but we just felt like it would be nicer to just write one for Lambda.

inspired by [Grape](https://github.com/ruby-grape/grape) a lot, since we really liked it

## Corgi Example

```typescript
export const routes: Routes = [
  new Namespace('/api/:userId', {
    params: {
      userId: Joi.number(),
    },
    before: async function() {
      this.params.user = await User.findByUserId(this.params.userId)
    },
    exceptionHandler: async function(error) {
      if (error.name == 'ValidationError') {
        const validationError = error as Joi.ValidationError;
        return this.json(
          {
            errors: validationError.details.map(e => e.message),
          },
          422
        );
      }
    },
    children: [
      Route.GET('/followers', {}, 'List of users that following me', async function() {
        return this.json({
          data: {}
        })
      }),
      new Namespace('/followings', {
        children: [
          Route.POST('/', '', {}, async function() {
            return this.json({ userId: this.params.user.id });
          }),
          Route.DELETE('/', '', {}, async function() {
            const userId = Number(this.params.userId);
            return this.json({ userId: this.params.user.id });
          }),
        ]
      })
    ]
  })
];

const router = new Router(routes);
exports.myHandler = router.handler();
```

Or refer src/__test__/e2e/complex_api.ts


