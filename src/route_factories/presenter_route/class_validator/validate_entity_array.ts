import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: "entityArrayValidation", async: false })
export class ValidateEntityArray implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [ elementClass ] = args.constraints;

    return value instanceof Array &&
      value.every((el) => el instanceof elementClass);
  }
}
