import * as jwt from 'jsonwebtoken';
import { addMilliseconds } from 'date-fns';
import Token from '../data/token/schema';

async function generateToken(email, session_id, user_id) {
  const accessToken = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '1d',
  });
  const maxAgeRefresh = 1000 * 60 * 60 * 24;
  const maxAgeAccess = 1000 * 60 * 15;
  await Token.create({
    user_id,
    refresh_token: refreshToken,
    access_token: accessToken,
    access_expires: addMilliseconds(Date.now(), maxAgeAccess),
    refresh_expires: addMilliseconds(Date.now(), maxAgeRefresh),
    session_id,
  });
  return { accessToken, refreshToken };
}

export default generateToken;
