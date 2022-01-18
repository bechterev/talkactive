import { Request } from 'express';
import Token from '../data/token/schema';
import User from '../data/user/schema';

const getUser = async (req: Request) => {
  let token = req.headers.authorization;
  token = token.replace('Bearer ', '');
  const tokendb = await Token.findOne({
    access_token: token,
    access_expires: { $gte: new Date() },
    revoke: false,
  });
  const user = await User.findOne({ _id: tokendb.user_id });
  return user;
};

export default getUser;
