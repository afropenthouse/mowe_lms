import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { config } from "./config.js";
const connection = new URL(config.DATABASE_URL);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(connection.hostname);
connection.searchParams.delete("sslmode");
connection.searchParams.delete("channel_binding");
const adapter = new PrismaPg(
  {
    connectionString: connection.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    enableChannelBinding: true,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  },
  { schema: "mowe_lms" },
);
export const db = new PrismaClient({
  adapter,
  log: [],
  // Remote PostgreSQL round trips and row-lock waits can exceed Prisma's
  // five-second default even for short transactions.
  transactionOptions: { maxWait: 10000, timeout: 20000 },
});
