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

type InvitationSnapshot = {
  content: InvitationContent;
  etag: string | null;
};

async function readFromBlob(): Promise<InvitationSnapshot> {
  const result = await get(SETTINGS_PATH, {
    access: "private",
    useCache: false,
  });

  if (!result) {
    return { content: DEFAULT_INVITATION_CONTENT, etag: null };
  }
  if (result.statusCode !== 200) {
    throw new Error(`Unexpected invitation settings response: ${result.statusCode}`);
  }

  const stored = (await new Response(result.stream).json()) as StoredInvitation;
  return {
    content: normalizeInvitationContent(stored.content),
    etag: result.blob.etag,
  };
}

export async function getPublishedInvitation(): Promise<InvitationContent> {
  try {
    return (await readFromBlob()).content;
  } catch {
    return DEFAULT_INVITATION_CONTENT;
  }
}

export async function getEditableInvitation(): Promise<InvitationContent> {
  return (await readFromBlob()).content;
}

export async function publishInvitation(value: unknown): Promise<InvitationContent> {
  const content = normalizeInvitationContent(value);
  const current = await readFromBlob();

  await put(
    SETTINGS_PATH,
    JSON.stringify({ content, updatedAt: new Date().toISOString() }),
    {
      access: "private",
      allowOverwrite: current.etag !== null,
      ifMatch: current.etag ?? undefined,
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
    },
  );

  return content;
}
