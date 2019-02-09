import * as Joi from "joi";

export type ParameterInputType = "query" | "header" | "path" | "formData" | "body";
export interface ParameterDefinition {
  in: ParameterInputType;
  def: Joi.Schema;
}
export interface ParameterDefinitionMap {
  [key: string]: ParameterDefinition;
}

export class Parameter {
  public static Query(schema: Joi.Schema): ParameterDefinition {
    return { in: "query", def: schema };
  }

  public static Path(schema: Joi.Schema): ParameterDefinition {
    return { in: "path", def: schema };
  }

  public static Body(schema: Joi.Schema): ParameterDefinition {
    return { in: "body", def: schema };
  }
}
