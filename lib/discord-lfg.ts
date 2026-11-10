import { discordTimestamp, formatInstant, SERVER_TIME_ZONE } from '@/lib/lfg-time';

export type WebhookMention = { discordId: string };

const SNOWFLAKE = /^\d{5,22}$/;

export function buildLfgWebhookPayload(input: {
  dungeonName: string;
  posterName: string;
  posterRole: string;
  startsAt: string;
  levelMin: number;
  levelMax: number;
  openSummary: string;
  notes: string | null;
  url: string;
  mentions: WebhookMention[];
  filled?: boolean;
}): Record<string, unknown> {
  const users = [...new Set(input.mentions.map(mention => mention.discordId).filter(id => SNOWFLAKE.test(id)))];
  const when = `${discordTimestamp(input.startsAt, 'F')} · server ${formatInstant(input.startsAt, SERVER_TIME_ZONE)}`;
  const content = input.filled ? undefined : users.map(id => `<@${id}>`).join(' ');
  const fields = [
    { name: 'When', value: when },
    { name: 'Roles still needed', value: input.openSummary || 'None' },
    { name: 'Levels', value: `${input.levelMin}–${input.levelMax}` },
    ...(input.notes?.trim() ? [{ name: 'Notes', value: input.notes.trim().slice(0, 500) }] : []),
    { name: 'Sign up', value: input.url },
  ];
  return {
    ...(content ? { content } : {}),
    allowed_mentions: { parse: [], users: input.filled ? [] : users },
    embeds: [
      {
        title: input.filled ? `Filled · ${input.dungeonName}` : input.dungeonName,
        url: input.url,
        color: 0xc9961a,
        description: input.filled
          ? 'This group is full.'
          : `${input.posterName} (${input.posterRole}) is forming a group.`,
        fields,
      },
    ],
  };
}

export async function sendDiscordWebhook(body: Record<string, unknown>): Promise<string | null> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return null;
  try {
    const endpoint = url.includes('?') ? `${url}&wait=true` : `${url}?wait=true`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null) as { id?: string } | null;
    return json?.id ?? null;
  } catch {
    return null;
  }
}

export async function editDiscordWebhook(messageId: string, body: Record<string, unknown>): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url || !messageId) return;
  try {
    const base = url.split('?')[0];
    await fetch(`${base}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // A missed edit should not fail the join.
  }
}
