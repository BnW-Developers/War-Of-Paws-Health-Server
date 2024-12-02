import { config } from "./config/config.js";
import express from "express";
import router from "./routes/index.router.js";
import errorHandlingMiddleware from "./middlewares/error-handling.middleware.js";

const app = express();

app.use(express.json());
app.use("/", router);
app.use(errorHandlingMiddleware);

app.listen(config.server.port, config.server.host, () => {
  console.log(`SERVER ON - ${config.server.host}:${config.server.port}`);
});
