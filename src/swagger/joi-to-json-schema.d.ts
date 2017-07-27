declare module "joi-to-json-schema" {
  import { Schema } from 'joi';
  type JSONSchema = any;
  function convert(joi: Schema, transformer?: (object: JSONSchema) => JSONSchema): JSONSchema;

  export = convert;
}
