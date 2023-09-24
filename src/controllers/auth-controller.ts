import { NextFunction, Request, RequestHandler, Response } from 'express';
import bcrypt from 'bcrypt';
import nodemailer, { Transporter } from 'nodemailer';
const sendgridTransport = require('nodemailer-sendgrid-transport');
import path from 'path';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import Handlebars from 'handlebars';
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
import {
  JWT_SECRET,
  REGISTER_LINK,
  SENDER_EMAIL,
  SENDGRID_KEY,
  WEBSITE,
} from '../utils/env-utils';
import { readFileSync } from 'fs';
import { VerifyEmailToken } from '../types/VerifyEmailToken.interface';

type RegisterRequest = {
  email: IUser['email'];
  password: IUser['password'];
  firstName: IUser['firstName'];
  lastName: IUser['lastName'];
  phone?: IUser['phone'];
  role: IUser['role'];
};

type LoginRequest = {
  email: IUser['email'];
  password: IUser['password'];
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, phone } = <RegisterRequest>(
    req.body
  );

  try {
    const isDuplicateEamil = await User.findOne({ email: email });

    if (isDuplicateEamil) {
      const error = new HttpException(
        400,
        'An account with this email already exists.'
      );
      throw error;
    }

    const hashedPassword: string = await bcrypt.hash(password, 12);

    const user = new User<IUser>({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone && phone,
      refreshToken: [],
    });

    await user.save();

    const transporter: Transporter = nodemailer.createTransport(
      sendgridTransport({
        auth: {
          api_key: SENDGRID_KEY,
        },
      })
    );

    const __dirname: string = path.resolve();
    const filePath: string = path.join(
      __dirname,
      './src/templates/verify-email.handlebars'
    );
    const emailSource: string = readFileSync(filePath, 'utf-8').toString();

    const token: string = jwt.sign(
      {
        email: email,
      },
      JWT_SECRET
    );

    const template = Handlebars.compile(emailSource);

    const replacements = {
      name: firstName,
      link: `${REGISTER_LINK}${token}`,
      website: WEBSITE,
    };

    const htmlToSend = template(replacements);

    await transporter.sendMail({
      to: email,
      from: SENDER_EMAIL,
      subject: 'Please verify your email address',
      html: htmlToSend,
    });

    res.status(201).json({
      message: 'User created. Please verify your email to login',
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
  const loginError = new HttpException(401, 'Email or password is incorrect');

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

    const expires: Date = new Date();
    const accessExpires: Date = new Date(expires.getTime() + 10 * 60000);
    const refreshExpires: Date = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 14);

    res
      .status(200)
      .cookie('AT', accessToken, {
        httpOnly: true,
        secure: true,
        expires: accessExpires,
      })
      .cookie('RT', refreshToken, {
        httpOnly: true,
        secure: true,
        expires: refreshExpires,
      })
      .json({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
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

const verify: RequestHandler = async (req, res, next) => {
  const verifyId = (req.params as { verifyId: string }).verifyId;

  try {
    const decodedToken = jwt.verify(verifyId, JWT_SECRET);

    const { email } = decodedToken as VerifyEmailToken;

    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error('A user with that email could not be found');
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: 'Email verified. Please login.',
    });
  } catch (error: unknown) {
    console.log('VERIFY EMAIL ERROR ', error);
    if (error instanceof HttpException) {
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
      next(error);
    }
    if (error instanceof JsonWebTokenError) {
      const err = new HttpException(404, 'Email address could not be verified');
      next(err);
    }
  }
};

export default {
  register,
  login,
  logout,
  verify,
};
