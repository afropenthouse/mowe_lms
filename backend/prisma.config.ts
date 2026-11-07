import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const connection = new URL(env("DATABASE_URL"));
connection.searchParams.set("schema", "mowe_lms");
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: connection.toString() },
});
