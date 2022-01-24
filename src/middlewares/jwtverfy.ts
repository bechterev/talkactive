import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import Token from '../data/token/schema';

const verifyJWT = (req: Request & { userId: string }, res: Response, next) => {
  if (
    req.path === `${process.env.BASE_PREFIX}signup`
    || req.path === `${process.env.BASE_PREFIX}signin`
  ) {
    next();
  } else {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
      if (err) return res.sendStatus(403);

      Token.findOne({
        access_token: token.replace('Bearer ', ''),
        access_expires: { $gte: new Date() },
        revoke: false,
      }).then((tokendb) => {
        if (!tokendb) return res.sendStatus(401);
        req.userId = decode.userId;
        return next();
      });
      return undefined;
    });
  }
  return undefined;
};
export default verifyJWT;
