import Agora from 'agora-access-token';

const rtc = async (room: string, userId: string) => {
  const appID = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERT;
  const expirationTimeInSeconds = 3600;
  const userAccount = userId;
  const role = Agora.RtcRole.PUBLISHER;
  const channel = room;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;
  const token = Agora.RtcTokenBuilder.buildTokenWithAccount(
    appID,
    appCertificate,
    channel,
    userAccount,
    role,
    expirationTimestamp,
  );
  return { userAccount, token };
};
export default rtc;
