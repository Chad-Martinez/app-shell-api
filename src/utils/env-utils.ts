import { config } from 'dotenv';
import { Secret } from 'jsonwebtoken';

config();

export const JWT_SECRET: Secret = process.env.JWT_SECRET_KEY!;

export const ACCESS_KEY: Secret = process.env.ACCESS_TOKEN_PRIVATE_KEY!;
export const REFRESH_KEY: Secret = process.env.REFRESH_TOKEN_PRIVATE_KEY!;

export const SENDGRID_KEY: string = process.env.SENDGRID_API_KEY!;
export const SENDER_EMAIL: string = process.env.SENDER_EMAIL_KEY!;
export const REGISTER_LINK: string = process.env.REGISTER_LINK_KEY!;
export const WEBSITE: string = process.env.WEBSITE_KEY!;
