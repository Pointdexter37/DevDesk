import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL;

export function getDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to Neon.");
  }

  return drizzle(neon(databaseUrl));
}
