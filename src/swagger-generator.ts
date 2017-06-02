import { Route } from './route';
import { Routes, Namespace } from './namespace';
import { flattenRoutes } from './router';

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
      const path = routes.map(r => r.path).join('');

      if (!paths[path]) {
        paths[path] = {}
      }
      paths[path][endRoute.method.toLowerCase()] = {
        description: endRoute.description,
        produces: [
          "application/json"
        ],
        "parameters": [
          {
            "in": "path",
            "name": "username",
            "description": "A user's username",
            "type": "string",
            "required": true
          }
        ],
        responses: {
          "200": {
            "description": "get GenderPrediction(s)"
          }
        },
        "tags": [
          "users"
        ],
        "operationId": "getUsersUsernameGenderPrediction",
      };
    });

    const tags: Tag[] = [];

    const swagger = {
      info: info.info,
      swagger: "2.0",
      produces: [
        "application/json; charset=utf-8",
      ],
      host: info.host || "www.balmbees.net",
      basePath: info.basePath || "/api",
      tags: tags,
      paths: paths,
    };

    return swagger;
  }
}

interface Tag {
  name: string;
  description: string;
}

interface Path {
  description: string;
  produces: string[];
  parameters: Parameter[];
  responses: { [key: string]: Response; },
  tags: string[];
  operationId: string;
}

interface Parameter {
  in: string;
  name: string;
  description: string;
  type: string;
  required: boolean;
}

interface Response {
  description: string;
}