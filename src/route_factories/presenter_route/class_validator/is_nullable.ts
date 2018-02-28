import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";

@ValidatorConstraint({ name: "isNullableValidation", async: false })
export class IsNullable implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    return value !== undefined;
  }
}
