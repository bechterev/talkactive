import admin from 'firebase-admin';
import { getTokens } from './device';
import rtc from '../rtc/agora';

const serviceAccount = require('../../firebase-service-account.json');

admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credential: admin.credential.cert(serviceAccount),
});

const generateFCMMessage = (
  token,
  payload,
  title: string | boolean = false,
  body: string | boolean = false,
) => {
  const data = { ...payload };

  const notification = { title, body };

  if (title) {
    notification.title = title.toString();
  }

  if (body) {
    notification.body = body.toString();
  }

  const message = {
    token,
    notification,
    data,
    android: {
      priority: 'high',
    },
  };
  return message;
};

const notifyWork = async (users, roomId) => {
  const tokens = await getTokens(users);

  const messages = [];

  const agoraTokens = await Promise.all(tokens.map((token) => rtc(roomId, token.user_id)));

  tokens.forEach((token, index) => {
    const payload = {
      action: 'room_started',
      room_id: roomId,
      agoraToken: agoraTokens[index].token,
      user_id: agoraTokens[index].userAccount,
    };

    const message = generateFCMMessage(
      token.token,
      payload,
      'Room ready',
      'Room members are ready to meet',
    );

    messages.push(message);
  });

  if (messages.length === 0) return undefined;

  const result = await admin.messaging().sendAll(messages);

  return result;
};

const notifyFinish = async (room) => {
  const tokens = await getTokens(room.members);

  const messages = [];

  tokens.forEach((token) => {
    const payload = {
      action: 'room_expired',
      room_id: room.id,
    };

    const message = generateFCMMessage(
      token.token,
      payload,
      'Room expired',
      'Room connection time out',
    );

    messages.push(message);
  });

  if (messages.length === 0) throw new Error('tokens not found');

  const result = await admin.messaging().sendAll(messages);

  return result;
};

export { generateFCMMessage, notifyWork, notifyFinish };
