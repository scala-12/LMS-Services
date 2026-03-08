type WithUserId<TData> = TData & { userId: string; }

export type UserPayload = {
  username: string | null;
  email: string;
  roles: string[];
}

export type UserInfo = WithUserId<UserPayload>;

type TokenData<T extends TokenType> = WithUserId<{
  expired: boolean;
  type: T
}>

export type AccessToken = UserPayload & TokenData<TokenType.ACCESS>

export type RefreshToken = TokenData<TokenType.REFRESH>

export enum TokenType {
  ACCESS = 'access_token',
  REFRESH = 'refresh_token'
}