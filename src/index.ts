import { NextFunction, Express, Request, Response } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import cors from 'cors';
import { HttpException } from './types/HttpException';
import cookiesMiddleware from 'universal-cookie-express';
import authRoutes from './routes/auth-routes';
import adminRoutes from './routes/admin-routes';

const PORT = process.env.DEV_PORT;
const MONGODB_URI = process.env.DB_CONNECTION;

config();

const app: Express = express();

app.use(cookiesMiddleware());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET, POST, PUT, PATCH, DELETE'],
    allowedHeaders: [
      'Access-Control-Allow-Headers',
      'Content-Type',
      'Authorization',
    ],
  })
);
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof HttpException) {
    console.log(error);
    const status = error.status || 500;
    const message = error.message;

    if (status === 401 || status === 403)
      return res
        .status(status)
        .clearCookie('AT')
        .clearCookie('RT')
        .json({ message: message });

    return res.status(status).json({ message: message });
  }
});

mongoose
  .connect(MONGODB_URI!)
  .then(() => {
    app.listen(PORT!);
    console.log('AUTH SHELL API IS RUNNING', PORT);
  })
  .catch((error: Error) => console.log(error));
