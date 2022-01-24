import { CronJob } from 'cron';
import { getFreeRoom } from './rooms';
import { getWaitUsers, managedUser, getWaitUsersSize } from './users';
import ActionManageUser from '../interfaces/action_manage_user';
import Room from '../data/room/schema';
import { CallState } from '../interfaces/state_call';
// import { rtc } from '../rtc/agora';

const defaultTask = async () => {
  const users = await getWaitUsersSize();
  if (users > 0) {
    const rooms = await getFreeRoom();
    const free = [];
    const expireRoom = rooms.filter(
      (room) => {
        if (room.expire_at < new Date() && room.stateRoom !== CallState.Work) return room;
        free.push(room); return false;
      },
    );
    if (expireRoom) {
      await Room.updateMany(
        { _id: { $in: expireRoom.map((el) => el.id) } },
        { stateRoom: CallState.Leave },
      );
    }
    free.sort((a, b) => a.members.length - b.members.length);
    console.log(free, 'cron');
    await Promise.all(free.map(async (room) => {
      const firstUsers = await getWaitUsers(3 - room.members.length);
      if (firstUsers.length > 0) {
        try {
          const members = Array.from(new Set([...room.members, ...firstUsers]));
          console.log(members);
          const upObj: { members: Array<any>, stateRoom?: CallState } = {
            members: Array.from(new Set([...room.members, ...firstUsers])),
          };
          console.log(members.length);
          // let agoraToken;
          switch (members.length) {
            case 1:
            case 2:
              upObj.stateRoom = CallState.Wait;
              break;
            case 3:
              upObj.stateRoom = CallState.Work;
              // agoraToken = await rtc(room.title);
              // return agoraToken from members
              break;
            default:
              break;
          }
          console.log(upObj);

          await Room.updateOne(
            { _id: room.id },
            upObj,
          );

          await Promise.all(firstUsers.map((el) => managedUser(el, ActionManageUser.Delete)));
        } catch (err) { console.log(`sorry --17-- not add new user ${err}`); }
      }
    }));
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
