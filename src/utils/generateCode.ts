import * as otpGenerator from "otp-generator"

export function generateCode() {
  return otpGenerator.generate(10, {
    digits: true,
    lowerCaseAlphabets: true,
    upperCaseAlphabets: true,
    specialChars: false,
  })
}
