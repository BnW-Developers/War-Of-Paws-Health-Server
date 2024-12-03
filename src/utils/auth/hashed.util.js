import { config } from '../../config/config.js';
import bcrypt from 'bcrypt';

export const hashed = async (key) => {
  return await bcrypt.hash(key, config.auth.salt);
};
