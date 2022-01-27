import { CronJob } from 'cron';
import { addMinutes, format } from 'date-fns';
import { getFreeRoom } from './rooms';
import { getWaitUsers, managedUser, getWaitUsersSize } from './users';
import ActionManageUser from '../interfaces/action_manage_user';
import Room from '../data/room/schema';
import { CallState } from '../interfaces/state_call';
import { notifyWork, notifyFinish } from './notification';

const defaultTask = async () => {
  const closeRoom = await Room.find({
    expire_at: { $lt: new Date() },
    $or: [{ stateRoom: CallState.Init }, { stateRoom: CallState.Wait }],
  });
  await Room.updateMany(
    {
      expire_at: { $lt: new Date() },
      $or: [{ stateRoom: CallState.Init }, { stateRoom: CallState.Wait }],
    },
    { stateRoom: CallState.Timeout },
  );
  if (closeRoom.length > 0) {
    await Promise.all(closeRoom.map((room) => notifyFinish(room)));
  }
  const users = getWaitUsersSize();
  if (users > 0) {
    const freeRooms = await getFreeRoom();

    if (!freeRooms.rooms) return;

    freeRooms.rooms.sort((a, b) => a.members.length - b.members.length);
    const { rooms } = freeRooms;

    rooms.forEach((room) => {
      const firstUsers = getWaitUsers(3 - room.members.length);
      if (firstUsers.length > 0) {
        try {
          const members = Array.from(new Set([...room.members, ...firstUsers]));

          if (room.members.length !== members.length) {
            Room.updateOne(
              { _id: room.id },
              {
                members: [...members],
                stateRoom: members.length === 3 ? CallState.Work : CallState.Wait,
                expire_at: format(addMinutes(new Date(), 5), 'MM.dd.yyyy HH:mm:ss'),
              },
            );

            if (members.length === 3) {
              notifyWork(members, room.id);
            }
            firstUsers.map((el) => managedUser(el, ActionManageUser.Delete));
          }
        } catch (error) { console.log(error); }
      }
    });
  }
};

class Clocker {
  cronJob : CronJob;

  constructor(task:any = defaultTask) {
    this.cronJob = new CronJob('*/10 * * * * *', async () => {
      try {
        await task();
      } catch (err) {
        console.log(err);
      }
    });
    if (!this.cronJob.running) {
      this.cronJob.start();
    }
  }
}
const cronos = () => {
  const clock = new Clocker();
  return clock;
};

export default cronos;
