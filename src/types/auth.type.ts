export interface AuthData {
  customerId: number;
  isFirstLogin: boolean;
  isNewCustomer?: boolean;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  session_state: string;
  scope: string;
}

export interface UserInfo {
  customerId: number;
  mobile: string;
  isLoggedIn: boolean;
}
