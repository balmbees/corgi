import { Route, HttpMethod} from './route';
import { Routes, Namespace } from './namespace';
import { RoutingContext } from './routing-context';
import { flattenRoutes } from './router';

import * as _ from 'lodash';
import * as Joi from 'joi';
import * as _string from 'underscore.string';

const JoiToSwagger = require('joi-to-swagger');

export class SwaggerRoute extends Namespace {
  constructor(
    path: string,
    info: {
      info: {
        title: string;
        version: string;
      },
      host: string;
      basePath: string;
    },
    routes: Routes
  ) {
    super(path, {
      children: [
        Route.OPTIONS('/', 'CORS Preflight Endpoint for Swagger Documentation API', {}, async function() {
          return this.json('', 204, {
            'Content-Type': 'application',
            'Access-Control-Allow-Origin': this.headers.origin || '',
            'Access-Control-Allow-Headers': [
              'Content-Type',
            ].join(', '),
            'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
            'Access-Control-Max-Age': `${60 * 60 * 24 * 30}`,
          });
        }),

        Route.GET('/', 'Swagger Documentation API', {}, async function() {
          const docGenerator = new SwaggerGenerator();
          const json = docGenerator.generateJSON(info, routes);
          return this.json(json, 200, {
            'Access-Control-Allow-Origin': this.headers.origin || '',
            'Access-Control-Allow-Headers': [
              'Content-Type',
            ].join(', '),
            'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].join(', '),
            'Access-Control-Max-Age': `${60 * 60 * 24 * 30}`,
          });
        }),
      ],
    });
  }
}

export class SwaggerGenerator {
  constructor() {}

  generateJSON(
    info: {
      info: {
        title: string;
        version: string;
      },
      host: string;
      basePath: string;
    }, routes: Routes
  ): any {
    const flattenedRoutes = flattenRoutes(routes);
    const paths: {
      [path: string]: {
        [method: string]: Path;
      }
    } = {};

    flattenedRoutes.forEach((routes) => {
      const endRoute = (routes[routes.length - 1] as Route);
      const corgiPath = routes.map(r => r.path).join('');
      const swaggerPath = this.toSwaggerPath(corgiPath);

      if (!paths[swaggerPath]) {
        paths[swaggerPath] = {}
      }
      paths[swaggerPath][endRoute.method.toLowerCase()] = {
        description: endRoute.desc,
        produces: [
          "application/json; charset=utf-8"
        ],
        parameters: _(routes).flatMap((route) => {
          if (route instanceof Namespace) {
            // Namespace only supports path
            return _.map(route.params, (schema, name) => {
              const { swagger } = JoiToSwagger(schema);
              return {
                in: 'path',
                name: name,
                description: '',
                type: swagger.type,
                required: true
              } as Parameter;
            });
          } else {
            return _.map(route.params, (paramDef, name) => {
              const { swagger } = JoiToSwagger(paramDef.def);
              return {
                in: paramDef.in,
                name: name,
                description: '',
                type: swagger.type,
                required: true
              } as Parameter;
            });
          }
        }).value(),
        responses: {
          "200": {
            "description": "Success"
          }
        },
        operationId: this.routesToOperationId(corgiPath, endRoute.method),
      };
    });

    const tags: Tag[] = [];

    const swagger = {
      info: info.info,
      swagger: "2.0",
      produces: [
        "application/json; charset=utf-8",
      ],
      host: info.host,
      basePath: info.basePath,
      tags: tags,
      paths: paths,
    };

    return swagger;
  }

  toSwaggerPath(path: string) {
    return path.replace(/\:(\w+)/g, '{$1}');
  }

  routesToOperationId(path: string, method: HttpMethod) {
    const operation =
      path.split('/').map((c) => {
        if (c.startsWith(':')) {
          return _string.capitalize(c.slice(1));
        } else {
          return _string.capitalize(c);
        }
      }).join('');

    return `${_string.capitalize(method.toLowerCase())}${operation}`;
  }
}

interface Tag {
  name: string;
  description: string;
}

interface Path {
  description: string;
  produces: string[];
  parameters?: Parameter[];
  responses: { [key: string]: Response; },
  tags?: string[];
  operationId: string;
}

interface Parameter {
  in: 'query' | 'header' | 'path' | 'formData' | 'body';
  name: string;
  description: string;
  type: string;
  required: boolean;
}

interface Response {
  description: string;
}