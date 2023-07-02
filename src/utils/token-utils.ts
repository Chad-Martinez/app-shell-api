import jwt, { Secret } from 'jsonwebtoken';
import UserToken from '../models/UserToken';
import { IUserToken } from '../types/UserToken.interface';
import { config } from 'dotenv';
import { IUser } from '../types/User.interface';

config();

const ACCESS_KEY: Secret = process.env.ACCESS_TOKEN_PRIVATE_KEY!;
const REFRESH_KEY: Secret = process.env.REFRESH_TOKEN_PRIVATE_KEY!;

const saveUserToken = async (
  userId: IUserToken['userId'],
  refreshToken: IUserToken['refreshToken']
): Promise<void> => {
  try {
    const userToken: IUserToken | null = await UserToken.findOne({
      userId: userId,
    });
    if (userToken) await userToken.remove();

    await new UserToken({
      userId: userId,
      refreshToken: refreshToken,
    }).save();
  } catch (error: unknown) {
    console.log(error);
  }
};

export const generateAccessToken = (user: IUser): string => {
  const payload = { userId: user._id, email: user.email, roles: user.roles };
  const accessToken = jwt.sign(payload, ACCESS_KEY, { expiresIn: '15m' });

  return accessToken;
};

export const generateRefreshToken = (user: IUser): string => {
  const payload = { userId: user._id, email: user.email };
  const refreshToken = jwt.sign(payload, REFRESH_KEY, { expiresIn: '15d' });

  saveUserToken(user._id, refreshToken);

  return refreshToken;
};
