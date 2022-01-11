import Agora from 'agora-access-token';

const rtc = async (socket) => {
  const appID = process.env.APP_ID;
  const appCertificate = process.env.APP_CERT;
  const expirationTimeInSeconds = 3600;
  const uid = Math.floor(Math.random() * 100000);
  const role = socket.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;
  const { channel } = socket;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;
  const token = Agora.RtcTokenBuilder.buildTokenWithUid(
    appID,
    appCertificate,
    channel,
    uid,
    role,
    expirationTimestamp,
  );
  return { uid, token };
};
export default rtc;
