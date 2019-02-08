import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "primitiveArrayValidation", async: false })
export class ValidatePrimitiveArray implements ValidatorConstraintInterface {
  public validate(value: any, args: ValidationArguments) {
    const [ elementClass ] = args.constraints;

    return value instanceof Array &&
      value.every((el) => el && el.constructor === elementClass);
  }
}
