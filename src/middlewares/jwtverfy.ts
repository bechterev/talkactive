import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import Token from '../data/token/schema';

const verifyJWT = (req: Request & { userId: string }, res: Response, next) => {
  if (
    req.path === `${process.env.BASE_PREFIX}signup`
    || req.path === `${process.env.BASE_PREFIX}signin`
    || req.path === `${process.env.BASE_PREFIX}device/unregister`
  ) {
    next();
  } else {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401)
        .json({ status: false, error: 'Invalid authorization' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(401)
          .json({ status: false, error: 'Invalid authorization' });
      }

      Token.findOne({
        access_token: token.replace('Bearer ', ''),
        revoke: false,
      }).then((tokendb) => {
        if (!tokendb) {
          return res.status(401)
            .json({ status: false, error: 'Invalid authorization' });
        }

        req.userId = decode.userId;

        return next();
      });
      return undefined;
    });
  }
  return undefined;
};
export default verifyJWT;
