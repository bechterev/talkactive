import { Error } from 'mongoose';
import Device from '../data/device/schema';

const upsertToken = async (token, type, userId) => {
  try {
    const matchToken = await Device.findOne({ token });
    console.log(matchToken, 'yes', token, type);
    if (matchToken) {
      matchToken.user_id = userId;
      matchToken.type = type;
      await matchToken.save();
      return { token: matchToken, error: undefined };
    }

    const newToken = await Device.create({ token });

    return { token: newToken, error: undefined };
  } catch (err) {
    return { token: undefined, error: err };
  }
};

const unregisterToken = async (token: string) => {
  const deleteToken = await Device.deleteOne({ token });
  if (deleteToken.deletedCount === 0) throw new Error('not found token');

  return true;
};

const getTokens = async (users: Array<string>) => {
  const token = await Device.find({}).where({ user_id: { $in: users } });
  return token;
};

export { upsertToken, unregisterToken, getTokens };
