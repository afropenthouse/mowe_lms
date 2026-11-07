import { app } from "./app.js";
import { config } from "./config.js";
import { db } from "./db.js";
import { closeMail } from "./mail.js";
const server = app.listen(config.PORT, "127.0.0.1", () =>
  console.log(`Auth backend: http://127.0.0.1:${config.PORT}`),
);
server.requestTimeout = 30000;
server.headersTimeout = 35000;
async function shutdown() {
  server.close();
  closeMail();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
