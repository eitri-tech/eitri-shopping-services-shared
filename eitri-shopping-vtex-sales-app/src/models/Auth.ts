export type AuthStatus = 'Success' | 'WrongCredentials' | 'BlockedUser' | string

export interface AuthCookie {
  Name: string
  Value: string
}

export interface LoginData {
  authStatus: AuthStatus
  promptMFA: boolean
  lastAttemptAvailable: number | null
  clientToken: string | null
  authCookie: AuthCookie | null
  accountAuthCookie: string | null
  expiresIn: number
  userId: string
  phoneNumber: string | null
  scope: string | null
}
