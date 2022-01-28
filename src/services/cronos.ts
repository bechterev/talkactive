import { CronJob } from 'cron';
import Room from '../data/room/schema';
import { CallState } from '../interfaces/state_call';
import { notifyFinish } from './notification';

const defaultTask = async () => {
  const closeRooms = await Room.find({
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
  if (closeRooms.length > 0) {
    await Promise.all(closeRooms.map((room) => notifyFinish(room)));
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
