declare module "joi-to-swagger" {
  import * as Joi from 'joi';

  function convert(joi: Joi.Schema): {
    swagger: {
      type: string;
    };
  };

  export = convert;
}
