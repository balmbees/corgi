[![Build Status](https://travis-ci.org/balmbees/corgi.svg?branch=master)](https://travis-ci.org/balmbees/corgi)

# Corgi
Restful HTTP Framework for AWS Lambda - AWS API Gateway Proxy Integration

<img width="500px" height="auto" src="https://scontent-hkg3-1.cdninstagram.com/t51.2885-15/e35/13735891_1160668067329731_1019397372_n.jpg" />

## Features
1. Cascade Routing
2. Route parameter

Whole thing supports async/await for sure, written in typescript also

## Reasoning

So simple lambda handler looks like this

```
exports.myHandler = function(event, context, callback) {
   console.log("value1 = " + event.key1);
   console.log("value2 = " + event.key2);
   callback(null, "some success message");
}
```

let's say you connected API Gateway, (using serverless maybe), as Lambda Proxy.
and wanna build some Restful API with that.

```
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
(even the one that running express itself on lambda even though it's completely unnecessary to run HTTP Server on lambda, which is what exactly AWS APIGateway is for)
https://www.npmjs.com/package/lambda-req
https://github.com/awslabs/aws-serverless-express
https://claudiajs.com/tutorials/serverless-express.html

we did considered about using any kind of those express wrapping seriously, but we just felt like it would be nicer to just write one for Lambda.
inspired by [Grape](https://github.com/ruby-grape/grape) a lot, since we really liked it

## Example

```
export const routes: Routes = [
  new Namespace('/api/:userId', {
    children: [
      new Route('/followers', 'GET', 'List of users that following me', async function(this: RoutingContext) {
        return this.json({
          data: {}
        })
      }),
      new Namespace('/followings', {
        before: async function(this: RoutingContext) {
        },
        children: [
          new Route('/', 'POST', '', async function(this: RoutingContext) {
            const userId = Number(this.params.userId);
            return this.json({ userId: userId });
          }),
          new Route('/', 'DELETE', '', async function(this: RoutingContext) {
            const userId = Number(this.params.userId);
            return this.json({ userId: userId });
          }),
        ]
      })
    ]
  })
];

const router = new Router(routes);
exports.myHandler = router.handler();
```
