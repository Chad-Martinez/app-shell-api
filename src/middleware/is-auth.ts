import { NextFunction, Response } from 'express';
import { ICookieRequest } from '../types/CookieRequeset.interface';
import { HttpException } from '../types/HttpException';
import {
  rotateTokens,
  validateAccessToken,
  validateRefreshToken,
} from '../utils/token-utils';

export const isAuth = async (
  req: ICookieRequest,
  res: Response,
  next: NextFunction
) => {
  const accessToken: string | null | undefined =
    req.universalCookies?.get('AT');

  const refreshToken: string | null | undefined =
    req.universalCookies?.get('RT');

  try {
    if (!accessToken || !refreshToken)
      throw new HttpException(401, 'Unauthorized Request');

    let newAccessToken: string = '';
    let newRefreshToken: string = '';

    const isValidAccessToken: boolean = validateAccessToken(accessToken);

    if (isValidAccessToken) {
      const { rotatedAccessToken, rotatedRefreshToken } = await rotateTokens(
        refreshToken
      );

      newAccessToken = rotatedAccessToken;
      newRefreshToken = rotatedRefreshToken;
    }

    if (!isValidAccessToken) {
      if (!refreshToken) {
        throw new HttpException(401, 'Unauthorized Request');
      }

      const isValidRefreshToken: boolean = await validateRefreshToken(
        refreshToken
      );

      if (isValidRefreshToken) {
        const { rotatedAccessToken, rotatedRefreshToken } = await rotateTokens(
          refreshToken
        );
        newAccessToken = rotatedAccessToken;
        newRefreshToken = rotatedRefreshToken;
      }

      if (!isValidRefreshToken) {
        throw new HttpException(401, 'Unauthorized Request');
      }
    }

    const expires: Date = new Date();
    expires.setDate(expires.getDate() + 14);

    res
      .cookie('AT', newAccessToken)
      .cookie('RT', newRefreshToken, { expires: expires });
    next();
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};
