import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { RoutingContext } from './routing-context';
import { flattenRoutes } from './router';

import * as _ from 'lodash';
import * as Joi from 'joi';
const JoiToSwagger = require('joi-to-swagger');

export class SwaggerRoute extends Route {
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
    super({
      path: path,
      method: 'GET',
      desc: 'Swagger Documentation API',
      handler: async function() {
        const docGenerator = new SwaggerGenerator();
        const json = docGenerator.generateJSON(info, routes);
        return this.json(json);
      }
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
      const path = this.toSwaggerPath(routes.map(r => r.path).join(''));

      if (!paths[path]) {
        paths[path] = {}
      }
      paths[path][endRoute.method.toLowerCase()] = {
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
        tags: [],
        operationId: `${endRoute.method} - ${path}`,
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