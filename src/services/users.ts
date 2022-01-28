import User from '../data/user/schema';

const getUser = async (userId: string) => {
  const user = await User.findOne({ _id: userId });

  return user;
};

export default getUser;
