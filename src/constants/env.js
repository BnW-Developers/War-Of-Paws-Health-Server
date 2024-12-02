import dotenv from "dotenv";

dotenv.config();

/* ============================SERVER============================ */
export const PORT = process.env.PORT || 3000;
export const HOST = process.env.HOST || "localhost";

/* ============================ KEY ============================ */
export const KEY = process.env.KEY;
export const SALT = process.env.SALT;
