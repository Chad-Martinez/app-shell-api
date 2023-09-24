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

    const isValidAccessToken: boolean = validateAccessToken(accessToken);

    if (isValidAccessToken) return next();

    if (!isValidAccessToken) {
      const isValidRefreshToken: boolean = await validateRefreshToken(
        refreshToken
      );

      if (!isValidRefreshToken) {
        throw new HttpException(401, 'Unauthorized Request');
      }

      if (isValidRefreshToken) {
        const { rotatedAccessToken, rotatedRefreshToken } = await rotateTokens(
          refreshToken
        );

        const expires: Date = new Date();
        const accessExpires: Date = new Date(expires.getTime() + 10 * 60000);
        const refreshExpires: Date = new Date();
        refreshExpires.setDate(refreshExpires.getDate() + 14);

        res
          .cookie('AT', rotatedAccessToken, {
            httpOnly: true,
            expires: accessExpires,
            secure: true,
          })
          .cookie('RT', rotatedRefreshToken, {
            httpOnly: true,
            expires: refreshExpires,
            secure: true,
          });
        next();
      }
    }
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};
