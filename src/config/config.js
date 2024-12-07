import { CHANNEL_ID, HOST, KEY, PORT, SALT, TOKEN } from '../constants/env.js';

export const config = {
  server: {
    host: HOST,
    port: PORT,
  },
  auth: {
    key: KEY,
    salt: SALT || 12,
  },
  discord: {
    token: TOKEN,
    channelId: CHANNEL_ID,
  },
};
