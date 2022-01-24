import User from '../data/user/schema';
import ActionManageUser from '../interfaces/action_manage_user';

const usersWaiting : Array<string> = [];

const managedUser = async (user_id: string, action: ActionManageUser) => {
  const uniqUser = new Set(usersWaiting);
  const matchUser = uniqUser.has(user_id);
  if (action === ActionManageUser.Add) {
    if (matchUser) throw new Error('the user already exists');
    usersWaiting.push(user_id);
  }
  if (action === ActionManageUser.Delete) {
    if (!matchUser) throw new Error('the user already not exists');
    usersWaiting.splice(0, 1);
  }
};

const getWaitUsers = async (count: number = 1) => {
  if (count < usersWaiting.length) return usersWaiting.slice(0, count);
  return [...usersWaiting];
};

const getUser = async (userId: string) => {
  const user = await User.findOne({ _id: userId });
  return user;
};
const getWaitUsersSize = async () => usersWaiting.length;

export {
  getUser, managedUser, getWaitUsers, getWaitUsersSize,
};
