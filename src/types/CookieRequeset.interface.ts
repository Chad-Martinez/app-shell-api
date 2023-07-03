import Cookies from 'universal-cookie';
import { Request } from 'express';

export interface ICookieRequest extends Request {
  universalCookies?: Cookies;
}
