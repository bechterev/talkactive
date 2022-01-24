import Agora from 'agora-access-token';

const rtc = async (room: string) => {
  const appID = process.env.APP_ID;
  const appCertificate = process.env.APP_CERT;
  const expirationTimeInSeconds = 3600;
  const uid = 0;
  const role = Agora.RtcRole.PUBLISHER;
  const channel = room;
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
