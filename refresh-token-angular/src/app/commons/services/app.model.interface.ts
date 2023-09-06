export interface IResponseLogin {
  username: string;
  accessToken: string;
  refreshToken: string;
}

export interface IResponseRefreshToken {
  username: string;
  accessToken: string;
  refreshToken: string;
}

export interface IResponseProduct {
  id: number,
  name: string,
  price: number,
}
