import { User } from "."


export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}
