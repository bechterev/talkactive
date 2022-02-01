import { Error } from 'mongoose';
import OS from '../interfaces/os';
import Device from '../data/device/schema';

const upsertToken = async (token, type, userId) => {
  try {
    const matchToken = await Device.findOne({ token });

    if (matchToken) {
      matchToken.user_id = userId;

      matchToken.type = type;

      await matchToken.save();

      return { token: matchToken, error: undefined };
    }
    console.log(type, OS.Android, type === OS.Android);
    const newToken = await Device.create({ token, type });

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
  const tokens = await Device.find({ user_id: { $in: users } });

  return tokens;
};

export { upsertToken, unregisterToken, getTokens };
