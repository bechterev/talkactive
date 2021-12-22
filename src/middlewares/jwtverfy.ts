import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

const verifyJWT = (req: Request & { email: string }, res: Response, next) => {
  if (
    req.path === '/signup'
    || req.path === '/signin'
    || req.path === '/refresh'
  ) {
    next();
  } else {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
      if (err) return res.sendStatus(403);
      req.email = decode.email;
      next();
      return undefined;
    });
  }
  return undefined;
};
export default verifyJWT;
