import jwt, { JwtPayload } from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/User.interface';
import { HttpException } from '../types/HttpException';
import { Types } from 'mongoose';
import { ACCESS_KEY, REFRESH_KEY } from './env-utils';

export const saveUserToken = async (
  user: IUser,
  newRefreshToken: string
): Promise<void> => {
  try {
    const { refreshToken }: { refreshToken: IUser['refreshToken'] } = user;
    const updatedRefreshTokenArray: IUser['refreshToken'] = [
      ...refreshToken,
      newRefreshToken,
    ];
    user.refreshToken = updatedRefreshTokenArray;
    await user.save();
  } catch (error: unknown) {
    console.log(error);
  }
};

export const generateAccessToken = (user: IUser): string => {
  const payload: JwtPayload = {
    sub: user._id,
    email: user.email,
    role: user.role,
  };
  const accessToken: string = jwt.sign(payload, ACCESS_KEY, {
    expiresIn: '15m',
  });

  return accessToken;
};

export const generateRefreshToken = (user: IUser): string => {
  const refreshToken: string = jwt.sign(
    { sub: user._id.toString() },
    REFRESH_KEY,
    {
      expiresIn: '15d',
    }
  );

  return refreshToken;
};

export const rotateTokens = async (
  refreshToken: string
): Promise<{
  rotatedAccessToken: string;
  rotatedRefreshToken: string;
}> => {
  try {
    const decodedToken: JwtPayload | string = jwt.verify(
      refreshToken,
      REFRESH_KEY
    );
    const user: IUser | null = await User.findOne({
      _id: new Types.ObjectId(decodedToken?.sub?.toString()),
    });

    if (!user) {
      throw new HttpException(401, 'Unauthorized Request');
    }

    const rotatedAccessToken: string = generateAccessToken(user);
    const rotatedRefreshToken: string = generateRefreshToken(user);

    const newRefreshTokenArray: Array<string> = user.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    user.refreshToken = [...newRefreshTokenArray, rotatedRefreshToken];
    await user.save();

    return {
      rotatedAccessToken,
      rotatedRefreshToken,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const validateAccessToken = (accessToken: string): boolean => {
  let isValid: boolean = false;

  try {
    jwt.verify(accessToken, ACCESS_KEY);
    isValid = true;
  } catch (error: unknown) {
    console.log(error);
  }

  return isValid;
};

export const validateRefreshToken = async (
  refreshToken: string
): Promise<boolean> => {
  let isValid: boolean = false;

  try {
    const foundUser: IUser | null = await User.findOne({
      refreshToken: refreshToken,
    });

    if (!foundUser) {
      jwt.verify(refreshToken, REFRESH_KEY, async (error, decoded) => {
        if (decoded?.sub) {
          const hackedUser: IUser | null = await User.findOne({
            _id: new Types.ObjectId(decoded.sub.toString()),
          });

          if (hackedUser) {
            hackedUser.refreshToken = [];
            await hackedUser.save();
          }
        }
      });
      return isValid;
    }

    const newRefreshTokenArray: Array<string> = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    jwt.verify(refreshToken, REFRESH_KEY, async (error, decoded) => {
      if (error) {
        foundUser.refreshToken = [...newRefreshTokenArray];
        await foundUser.save();

        return isValid;
      }

      isValid = true;
    });

    return isValid;
  } catch (error: unknown) {
    console.log(error);
  }
  return isValid;
};

export const invalidateRefreshToken = async (
  refreshToken: string
): Promise<void> => {
  try {
    const foundUser: IUser | null = await User.findOne({
      refreshToken: refreshToken,
    });

    if (!foundUser) return;

    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );

    await foundUser.save();
  } catch (error: unknown) {
    console.log(error);
  }
};
