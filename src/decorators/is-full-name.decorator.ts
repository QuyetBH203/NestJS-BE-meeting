import { ValidationOptions, registerDecorator } from "class-validator"
import isFullName from "src/utils/isFullName"

export function IsFullName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isFullName",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === "string" && isFullName(value)
        },
        defaultMessage({ property }) {
          return `${property} is not a valid fullname`
        },
      },
    })
  }
}
