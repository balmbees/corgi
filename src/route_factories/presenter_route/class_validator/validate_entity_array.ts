import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "entityArrayValidation", async: false })
export class ValidateEntityArray implements ValidatorConstraintInterface {
  public validate(value: any, args: ValidationArguments) {
    const [ elementClass ] = args.constraints;

    return value instanceof Array &&
      value.every((el) => el instanceof elementClass);
  }
}
