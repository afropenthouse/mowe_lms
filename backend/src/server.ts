import { app } from "./app.js";
import { config } from "./config.js";
import { db } from "./db.js";
import { closeMail } from "./mail.js";
const host = config.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
const server = app.listen(config.PORT, host, () =>
  console.log(`Auth backend listening on ${host}:${config.PORT}`),
);
server.requestTimeout = 30000;
server.headersTimeout = 35000;
async function shutdown() {
  server.close();
  closeMail();
  await db.$disconnect();
  process.exitCode = 0;
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
