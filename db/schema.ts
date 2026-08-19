import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const invitationSettings = sqliteTable("invitation_settings", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
