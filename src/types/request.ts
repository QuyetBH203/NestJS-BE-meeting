import { User } from "@prisma/client"
import { Request } from "express"
import { Profile as GoogleProfile } from "passport-google-oauth20"

export interface RequestWithGoogleUser extends Request {
  user: GoogleProfile
}

export interface RequestWithUser extends Request {
  user: User
}
