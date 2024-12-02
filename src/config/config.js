import { HOST, KEY, PORT, SALT } from "../constants/env.js";

export const config = {
  server: {
    host: HOST,
    port: PORT,
  },
  auth: {
    key: KEY,
    salt: SALT,
  },
};
