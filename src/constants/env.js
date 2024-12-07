import dotenv from 'dotenv';

dotenv.config();

/* ============================SERVER============================ */
export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || 'localhost';

/* ============================ KEY ============================ */
export const KEY = process.env.KEY;
export const SALT = process.env.SALT;
/* ===========================DISCORD=========================== */
export const TOKEN = process.env.TOKEN;
export const CHANNEL_ID = process.env.CHANNEL_ID;
