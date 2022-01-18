import { isAfter, addMinutes } from 'date-fns';
import { CallState, callStateArray } from '../interfaces/state_call';
import { addUserFromRoom } from './rooms';
import {
  getListUsersQueue, findFreeRoomAllQueue, updateManyRoomQueue, addUserInRoomQueue,
  changeListUsersQueue,
} from './queue';
import { RoomInQueue } from '../queue_import';
import { delay } from './util';

const task = async () => {
  const [usersQueue, roomsQueue] = await Promise.all([getListUsersQueue(), findFreeRoomAllQueue()]);
  let roomsExpired: Array<RoomInQueue> = [];
  const roomsFree: Array<RoomInQueue> = [];
  roomsQueue.forEach((el) => {
    if (el.expire_at < new Date() && el.stateRoom !== CallState.Work) roomsExpired.push(el);
    else roomsFree.push(el);
  });
  const priorityRoomsQueue = roomsFree.sort((a, b) => {
    if (isAfter(a.expire_at, b.expire_at)
      && (a.members.length > b.members.length)) return 1;
    return -1;
  });

  if (roomsExpired.length > 0) {
    roomsExpired = roomsExpired.map((room) => {
      // TO DO notifiers
      const item = { ...room };
      item.stateRoom = CallState.Leave;
      const members = item.members.splice(0, room.members.length - 1);
      members.map((member) => addUserInRoomQueue(member));
      return item;
    });
  }
  const user = Array.from(usersQueue);

  try {
    const changeRoomsQueue = priorityRoomsQueue.map((room) => {
      const membersRoom = [...room.members];
      while (membersRoom.length < 3 && user.length !== 0) {
        const email = user.splice(0, 1);
        membersRoom.push(email[0].email);
      }

      if (membersRoom.length === room.members.length) return room;

      const newRoom: RoomInQueue = {
        room_id: room.room_id,
        title: room.title,
        expire_at: addMinutes(new Date(), 5),
        members: membersRoom,
        stateRoom: callStateArray[membersRoom.length - 1],
      };

      if (membersRoom.length === 3) console.log('room full');// TO DO notifiers

      membersRoom.forEach(
        (member) => addUserFromRoom(room.room_id, room.members, member, newRoom.stateRoom),
      );
      return newRoom;
    });
    await changeListUsersQueue(new Set(user));
    await updateManyRoomQueue(changeRoomsQueue);
  } catch (error) {
    console.log(error);
  }

  await delay(Number(process.env.TIME_TASK));
  task();
};

export default task;
