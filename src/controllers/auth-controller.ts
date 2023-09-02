import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { IUser } from '../types/User.interface';
import { HttpException } from '../types/HttpException';
import {
  generateAccessToken,
  generateRefreshToken,
  saveUserToken,
  invalidateRefreshToken,
} from '../utils/token-utils';
import { ICookieRequest } from '../types/CookieRequeset.interface';

type RegisterRequest = {
  email: IUser['email'];
  password: IUser['password'];
  firstName: IUser['firstName'];
  lastName: IUser['lastName'];
  role: IUser['role'];
};

type LoginRequest = {
  email: IUser['email'];
  password: IUser['password'];
};

const loginError = new HttpException(401, 'Email or password is incorrect');

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName } = <RegisterRequest>req.body;

  try {
    const isDuplicateEamil = await User.findOne({ email: email });
    if (isDuplicateEamil) {
      const error = new HttpException(
        400,
        'An account with this email already exists.'
      );
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User<IUser>({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      refreshToken: [],
    });
    const createdUser = await user.save();
    res.status(201).json({
      message: 'User created. Please verify your email to login',
      userId: createdUser._id,
    });
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};

const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const { email, password } = <LoginRequest>req.body;
  try {
    const user: IUser | null = await User.findOne({ email: email });
    if (!user) {
      const error: HttpException = loginError;
      throw error;
    }
    const isValidPassword: boolean = await bcrypt.compare(
      password,
      user.password
    );
    if (!isValidPassword) {
      const error: HttpException = loginError;
      throw error;
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await saveUserToken(user, refreshToken);

    const expires = new Date();
    expires.setDate(expires.getDate() + 14);

    res
      .status(200)
      .cookie('AT', accessToken)
      .cookie('RT', refreshToken, { expires: expires })
      .json({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        message: 'Login Successful!',
      });
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};

const logout = async (
  req: ICookieRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken: string | null | undefined =
      req.universalCookies?.get('RT');
    if (!refreshToken) return;
    await invalidateRefreshToken(refreshToken);
    res
      .status(200)
      .clearCookie('AT')
      .clearCookie('RT')
      .json({ message: 'Logout Successful!' });
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};

export default {
  register,
  login,
  logout,
};
