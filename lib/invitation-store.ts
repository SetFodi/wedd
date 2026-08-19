import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { invitationSettings } from "@/db/schema";
import {
  DEFAULT_INVITATION_CONTENT,
  normalizeInvitationContent,
  type InvitationContent,
} from "./invitation-content";

let schemaReady: Promise<void> | undefined;

async function database() {
  const db = await getDb();
  schemaReady ??= db
    .run(sql`
      CREATE TABLE IF NOT EXISTS invitation_settings (
        id INTEGER PRIMARY KEY NOT NULL,
        content TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)
    .then(() => undefined)
    .catch((error) => {
      schemaReady = undefined;
      throw error;
    });
  await schemaReady;
  return db;
}

async function readFromDatabase(): Promise<InvitationContent> {
  const db = await database();
  const [row] = await db
    .select({ content: invitationSettings.content })
    .from(invitationSettings)
    .where(eq(invitationSettings.id, 1))
    .limit(1);

  if (!row) return DEFAULT_INVITATION_CONTENT;

  try {
    return normalizeInvitationContent(JSON.parse(row.content));
  } catch {
    return DEFAULT_INVITATION_CONTENT;
  }
}

export async function getPublishedInvitation(): Promise<InvitationContent> {
  try {
    return await readFromDatabase();
  } catch {
    return DEFAULT_INVITATION_CONTENT;
  }
}

export async function getEditableInvitation(): Promise<InvitationContent> {
  return readFromDatabase();
}

export async function publishInvitation(value: unknown): Promise<InvitationContent> {
  const content = normalizeInvitationContent(value);
  const db = await database();
  await db
    .insert(invitationSettings)
    .values({
      id: 1,
      content: JSON.stringify(content),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: invitationSettings.id,
      set: {
        content: JSON.stringify(content),
        updatedAt: new Date(),
      },
    });
  return content;
}
