import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { IUser } from '../types/User.interface';
import { HttpException } from '../types/HttpException';

type RegisterRequest = {
  email: IUser['email'];
  password: IUser['password'];
  firstName: IUser['firstName'];
  lastName: IUser['lastName'];
  roles: IUser['roles'];
};

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
    });
    const createdUser = await user.save();
    res.status(201).json({
      message: 'User created. Please verify your email to login',
      userId: createdUser._id,
    });
  } catch (error: any) {
    console.log(error);
    if (error instanceof HttpException) {
      console.log(error);
      error.status || 500;
      error.message || 'Internal Error. Try your request again.';
    }
    next(error);
  }
};

export default {
  register,
};
