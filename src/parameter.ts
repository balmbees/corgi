import * as Joi from "joi";
import * as OpenAPI from "openapi3-ts";

export type ParameterInputType = "query" | "header" | "path" | "formData" | "body";
export type ParameterDefinition = (
  {
    type: "joi";
    in: ParameterInputType;
    def: Joi.Schema;
  } | {
    type: "open-api";
    schema: Omit<OpenAPI.ParameterObject, "name">,
  }
);

export interface ParameterDefinitionMap {
  [key: string]: ParameterDefinition;
}

export class Parameter {
  public static openAPI(schema: Omit<OpenAPI.ParameterObject, "name">): ParameterDefinition {
    return { type: "open-api", schema };
  }

  public static Query(schema: Joi.Schema): ParameterDefinition {
    return { type: "joi", in: "query", def: schema };
  }

  public static Path(schema: Joi.Schema): ParameterDefinition {
    return { type: "joi", in: "path", def: schema };
  }

  public static Body(schema: Joi.Schema): ParameterDefinition {
    return { type: "joi", in: "body", def: schema };
  }
}
