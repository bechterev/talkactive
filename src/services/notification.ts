import admin from 'firebase-admin';
import { getTokens } from './device';
import rtc from '../rtc/agora';

const serviceAccount = require('../../talktest-7623b-firebase-adminsdk-eugsc-2893517b70.json');

admin.initializeApp({
  projectId: 'talktest-7623b',
  credential: admin.credential.cert(serviceAccount),
});

const generateFCMMessage = (
  token,
  payload,
  title: string | boolean = false,
  body: string | boolean = false,
) => {
  const data = {
    payload,
    title: undefined,
    body: undefined,
  };
  if (title) {
    data.title = title.toString();
  }
  if (body) {
    data.body = body.toString();
  }
  const message = {
    token,
    data,
    android: {
      priority: 'high',
    },
  };
  return message;
};

const notifyWork = async (users, roomId) => {
  try {
    const tokens = await getTokens(users);
    const messages = [];
    const agoraToken = await rtc(roomId);
    tokens.forEach((token) => {
      const payload = {
        action: 'room_started',
        room_id: roomId,
        agoraToken,
      };
      const message = generateFCMMessage(
        token,
        payload,
        'Room ready',
        'Room members are ready to meet',
      );
      messages.push(message);
    });
    admin.messaging().sendAll(messages);
    return undefined;
  } catch (err) { return err; }
};
const notifyFinish = async (room) => {
  try {
    const tokens = await getTokens(room.members);
    const messages = [];
    tokens.forEach((token) => {
      const payload = {
        action: 'room_expired',
        room_id: room.id,
      };
      const message = generateFCMMessage(
        token,
        payload,
        'Room expired',
        'Room connection time out',
      );
      messages.push(message);
    });
    admin.messaging().sendAll(messages);
    return undefined;
  } catch (err) { return err; }
};

export { generateFCMMessage, notifyWork, notifyFinish };
