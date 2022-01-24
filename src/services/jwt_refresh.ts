import * as jwt from 'jsonwebtoken';
import { addMilliseconds } from 'date-fns';
import Token from '../data/token/schema';

async function generateToken(session_id, userId) {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: `${process.env.ACCESS_TOKEN_LIVE}m`,
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });
  const maxAgeRefresh = 1000 * 60 * 60 * 24;
  const maxAgeAccess = 1000 * 60 * Number(process.env.ACCESS_TOKEN_LIVE);
  await Token.create({
    user_id: userId,
    refresh_token: refreshToken,
    access_token: accessToken,
    access_expires: addMilliseconds(Date.now(), maxAgeAccess),
    refresh_expires: addMilliseconds(Date.now(), maxAgeRefresh),
    session_id,
  });
  return { accessToken, refreshToken };
}

export default generateToken;
