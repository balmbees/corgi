[![Travis Build Status](https://travis-ci.org/balmbees/corgi.svg?branch=master)](https://travis-ci.org/balmbees/corgi)
[![npm version](https://badge.fury.io/js/vingle-corgi.svg)](https://badge.fury.io/js/vingle-corgi)

# Corgi
[Grape](https://github.com/ruby-grape/grape) like lightweight HTTP API Framework for AWS Lambda

## Example
```typescript
const router = new Router([
  new Namespace('/api/:userId', {
    params: {
      userId: Joi.number(),
    },
    async before() {
      this.params.user = await User.findByUserId(this.params.userId);
      if (!this.params.user) {
        this.json({
          error: "User not exists!",
        }, 404);
        // You can also just throw error - which goes to exceptionHandler
      }
    },
    async exceptionHandler(error) {
      // Global Exception Handling.
      if (error.name === 'ValidationError') {
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
            const user = this.params.user as User;
            return this.json({ userId: user.id });
          }),

          Route.DELETE('/', '', {}, async function() {
            const user = this.params.user as User;
            return this.json({ userId: user.id });
          }),
        ]
      })
    ]
  })
]);

// this goes directly into lambda.
export const handler = router.handler();
```

Or refer src/__test__/e2e/complex_api.ts


## How to start
1. npm install vingle-corgi
2. exports.handler = new Router([routes]).handler();
3. deploy lambda


## Why do I need an extra Framework for Lambda?

So simple lambda handler looks like this

```js
exports.myHandler = function(event, context, callback) {
   console.log("value1 = " + event.key1);
   console.log("value2 = " + event.key2);
   callback(null, "some success message");
}
```

let's say you connected API Gateway, (using serverless maybe),
as Lambda Proxy. and built some Restful API with that.

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

Ok, fairly good, since it's on lambda and APIGateway so everything is managed and scaled....etc.  
but also you can clearly see that this is at the tipping point of going unmanageable. 

there are several frameworks that built for this,  
(such as running express itself on lambda, even though which is what exactly AWS APIGateway is for)  
[lambda-req](https://www.npmjs.com/package/lambda-req)  
[aws-serverless-express](https://github.com/awslabs/aws-serverless-express)  
[serverless-express](https://claudiajs.com/tutorials/serverless-express.html)  

At Vingle, we did consider about using these kinds of express wrapping.  
But those are really inefficient and not reliable for production usage,   
and, most of all, We really thought we can do better.  
Inspired by [Grape](https://github.com/ruby-grape/grape) a lot, since we really liked it

## Features
1. Cascade Routing
2. Route parameter
    - such as "users/:userId/followings"
3. Parameter Validation
    - it uses [Joi](https://github.com/hapijs/joi)
4. Exception Handling
    - refer [example](src/__test__/e2e/complex_api.ts)
5. Swagger Document Generation
    - [Swagger](http://swagger.io/) is API Documentation spec. Corgi support automatic swagger document generation.
    - refer [example](src/swagger/__test__/index_spec.ts#L148)
6. View
    - Named "Presenter". basically, you return "model" from Route, and "presenter" defines how you convert this model into HTTP resource such as JSON
The whole thing supports async/await!, written in typescript from scratch also

## Requirements
From v2.0, it only supports lambda nodejs8.10. if you need 6.10 support, either use v1.x or wrap router.handler
