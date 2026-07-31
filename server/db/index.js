import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || "postgres://localhost:5432/sso_db";
  console.log("Database URL (masked):", url.replace(/:[^:@]+@/, ":****@"));
  return url;
};
const queryClient = postgres(getDatabaseUrl(), {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});
const db = drizzle(queryClient, { schema });
export * from "./schema";
import {
  accessGroups,
  accessGroupUsers,
  accessGroupClients,
  accessGroupsRelations,
  accessGroupUsersRelations,
  accessGroupClientsRelations
} from "./schema";
export {
  accessGroupClients,
  accessGroupClientsRelations,
  accessGroupUsers,
  accessGroupUsersRelations,
  accessGroups,
  accessGroupsRelations,
  db,
  queryClient
};
