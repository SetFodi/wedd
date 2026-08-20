import { get, put } from "@vercel/blob";
import {
  DEFAULT_INVITATION_CONTENT,
  normalizeInvitationContent,
  type InvitationContent,
} from "./invitation-content";

const SETTINGS_PATH = "invitation/settings.json";

type StoredInvitation = {
  content?: unknown;
  updatedAt?: unknown;
};

async function readFromBlob(): Promise<InvitationContent> {
  const result = await get(SETTINGS_PATH, {
    access: "private",
    useCache: false,
  });

  if (!result) {
    return DEFAULT_INVITATION_CONTENT;
  }
  if (result.statusCode !== 200) {
    throw new Error(`Unexpected invitation settings response: ${result.statusCode}`);
  }

  const stored = (await new Response(result.stream).json()) as StoredInvitation;
  return normalizeInvitationContent(stored.content);
}

export async function getPublishedInvitation(): Promise<InvitationContent> {
  try {
    return await readFromBlob();
  } catch {
    return DEFAULT_INVITATION_CONTENT;
  }
}

export async function getEditableInvitation(): Promise<InvitationContent> {
  return readFromBlob();
}

export async function publishInvitation(value: unknown): Promise<InvitationContent> {
  const content = normalizeInvitationContent(value);

  await put(
    SETTINGS_PATH,
    JSON.stringify({ content, updatedAt: new Date().toISOString() }),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
    },
  );

  return content;
}
