import * as Joi from 'joi';

export type ParameterInputType = 'query' | 'header' | 'path' | 'formData' | 'body';
export interface ParameterDefinition {
  in: ParameterInputType;
  def: Joi.Schema;
};
export type ParameterDefinitionMap = {
  [key: string]: ParameterDefinition;
};

export class Parameter {
  static Query(schema: Joi.Schema): ParameterDefinition {
    return { in: 'query', def: schema }
  }

  static Path(schema: Joi.Schema): ParameterDefinition {
    return { in: 'path', def: schema }
  }
}