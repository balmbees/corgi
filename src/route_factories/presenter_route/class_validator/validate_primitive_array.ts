import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: "primitiveArrayValidation", async: false })
export class ValidatePrimitiveArray implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [ elementClass ] = args.constraints;

    return value instanceof Array &&
      value.every((el) => el && el.constructor === elementClass);
  }
}
