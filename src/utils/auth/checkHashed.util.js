import bcrypt from "bcrypt";
import { config } from "../../config/config.js";

export const checkHashed = (hash) => {
  return bcrypt.compare(config.auth.key, hash);
};
