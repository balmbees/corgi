import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

@ValidatorConstraint({ name: "isNullableValidation", async: false })
export class IsNullable implements ValidatorConstraintInterface {
  public validate(value: any, args: ValidationArguments) {
    return value !== undefined;
  }
}
