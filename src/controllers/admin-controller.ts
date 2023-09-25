import { RequestHandler } from 'express';
import { HttpException } from '../types/HttpException';

const getResource: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    //ADMIN RESOURCE LOGIC...

    res.status(200).json({
      message: 'DUMMY RESOURCE RETURNED',
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

export default {
  getResource,
};
