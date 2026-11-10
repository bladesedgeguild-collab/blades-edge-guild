import { getDungeon } from '@/data/dungeons/index';
import { buildLfgWebhookPayload, editDiscordWebhook, sendDiscordWebhook } from '@/lib/discord-lfg';
import {
  claimSlot,
  isGroupFull,
  needsSummary,
  normalizeGroup,
  resolveNeeds,
  type Group,
  type GroupMember,
  type Needs,
} from '@/lib/lfg-group';
import { DISCORD_DAILY_CAP, discordMentions, type MentionChar } from '@/lib/lfg-match';
import { serverClock } from '@/lib/lfg-time';
import { fullName } from '@/lib/names';
import { effectiveRoles, roleKeyOf, type LfgRole, type RoleKey } from '@/lib/roles';

// Service-role client. Routes pass the Supabase client they already construct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

export type ClaimedCharacter = {
  id: string;
  name: string;
  last_name: string | null;
  class: string;
  level: number;
  is_main: boolean;
  roles: string[] | null;
};

const FALLBACK_NEEDS: Needs = { tank: 1, healer: 1, dps: 3 };

export function dungeonNeeds(slug: string): Needs {
  const dungeon = getDungeon(slug);
  if (!dungeon) return { ...FALLBACK_NEEDS };
  return {
    tank: dungeon.groupComp.tank,
    healer: dungeon.groupComp.healer,
    dps: dungeon.groupComp.dps,
  };
}

export async function loadClaimedCharacter(admin: Admin, userId: string, characterId: string): Promise<ClaimedCharacter | null> {
  const withRoles = await admin
    .from('characters')
    .select('id, name, last_name, class, level, is_main, roles')
    .eq('id', characterId)
    .eq('claimed_by', userId)
    .maybeSingle();
  if (!withRoles.error && withRoles.data) return withRoles.data as ClaimedCharacter;
  const message = withRoles.error?.message ?? '';
  if (withRoles.error && !/roles/i.test(message)) return null;
  const fallback = await admin
    .from('characters')
    .select('id, name, last_name, class, level, is_main')
    .eq('id', characterId)
    .eq('claimed_by', userId)
    .maybeSingle();
  if (!fallback.data) return null;
  return { ...fallback.data, roles: null } as ClaimedCharacter;
}

export async function hasAccepted(admin: Admin, lfgId: string, userId: string): Promise<boolean> {
  const { data } = await admin
    .from('dungeon_lfg_responses')
    .select('id')
    .eq('lfg_id', lfgId)
    .eq('user_id', userId)
    .eq('response', 'accepted')
    .maybeSingle();
  return !!data;
}

export function characterCanPlay(character: ClaimedCharacter, role: LfgRole): boolean {
  return effectiveRoles(character.class, character.roles).includes(role);
}

export function toMember(character: ClaimedCharacter): GroupMember {
  return {
    name: fullName(character.name, character.last_name),
    level: character.level,
    characterId: character.id,
  };
}

export async function placeInGroup(
  admin: Admin,
  post: { id: string; dungeon_slug: string; needs: unknown; current_group: unknown },
  role: RoleKey,
  member: GroupMember,
): Promise<{ ok: true; group: Group; needs: Needs } | { ok: false; status: number; error: string }> {
  const needs = resolveNeeds(post.needs, dungeonNeeds(post.dungeon_slug));
  const rpc = await admin.rpc('lfg_claim_slot', {
    p_lfg_id: post.id,
    p_role: role,
    p_member: member,
  });
  if (!rpc.error) {
    return { ok: true, group: normalizeGroup(rpc.data), needs };
  }
  const message = String(rpc.error.message ?? '');
  if (/full/i.test(message)) return { ok: false, status: 409, error: 'That role is full.' };
  if (/not found|expired/i.test(message)) return { ok: false, status: 404, error: 'That call has expired.' };
  const missingFunction = /lfg_claim_slot|schema cache|could not find the function|PGRST202/i.test(message);
  if (!missingFunction) {
    console.error('lfg_claim_slot', message);
    return { ok: false, status: 500, error: 'Could not join the group.' };
  }
  const claimed = claimSlot(normalizeGroup(post.current_group), needs, role, member);
  if (!claimed.ok) return { ok: false, status: 409, error: 'That role is full.' };
  const updated = await admin.from('dungeon_lfg').update({ current_group: claimed.group }).eq('id', post.id);
  if (updated.error) return { ok: false, status: 500, error: 'Could not join the group.' };
  return { ok: true, group: claimed.group, needs };
}

export async function notifyJoin(admin: Admin, input: {
  posterId: string;
  joinerId: string;
  joinerName: string;
  role: string;
  dungeonName: string;
  slug: string;
  lfgId: string;
  full: boolean;
  discordMessageId: string | null;
  startsAt: string | null;
  levelMin: number;
  levelMax: number;
}): Promise<void> {
  if (input.posterId === input.joinerId) return;
  await admin.from('notifications').insert({
    user_id: input.posterId,
    type: input.full ? 'lfg_full' : 'lfg_join',
    title: input.full
      ? `Your ${input.dungeonName} group is full`
      : `${input.joinerName} joined your ${input.dungeonName} group`,
    body: input.full
      ? `${input.joinerName} took the last ${input.role} spot.`
      : `${input.joinerName} signed on as ${input.role}.`,
    link: `/dungeons/${input.slug}?lfg=${input.lfgId}`,
    read: false,
  });
  if (!input.full || !input.discordMessageId || !input.startsAt) return;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bladesedgeguild.com';
  await editDiscordWebhook(input.discordMessageId, buildLfgWebhookPayload({
    dungeonName: input.dungeonName,
    posterName: input.joinerName,
    posterRole: input.role,
    startsAt: input.startsAt,
    levelMin: input.levelMin,
    levelMax: input.levelMax,
    openSummary: 'Group is full.',
    notes: null,
    url: `${site}/dungeons/${input.slug}?lfg=${input.lfgId}`,
    mentions: [],
    filled: true,
  }));
}

export function legacySchedule(startsAt: Date, endsAt: Date) {
  const start = serverClock(startsAt);
  const end = serverClock(endsAt);
  return {
    days_available: [start.day],
    time_start: start.time,
    time_end: end.time,
    timezone_label: 'America/Denver',
    available_window: `${start.day} ${start.time}–${end.time} Server Time`,
  };
}

export async function announceNewPost(admin: Admin, post: {
  id: string;
  user_id: string;
  dungeon_slug: string;
  character_name: string;
  role: string;
  notes: string | null;
  starts_at: string;
  needs: Needs;
  current_group: Group;
}): Promise<void> {
  const dungeon = getDungeon(post.dungeon_slug);
  if (!dungeon) return;
  const mentions = await matchedDiscordMentions(admin, post);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bladesedgeguild.com';
  const url = `${site}/dungeons/${post.dungeon_slug}?lfg=${post.id}`;
  const payload = buildLfgWebhookPayload({
    dungeonName: dungeon.name,
    posterName: post.character_name,
    posterRole: post.role,
    startsAt: post.starts_at,
    levelMin: dungeon.recommendedLevelMin,
    levelMax: dungeon.recommendedLevelMax,
    openSummary: needsSummary(post.needs, post.current_group),
    notes: post.notes,
    url,
    mentions,
  });
  const messageId = await sendDiscordWebhook(payload);
  if (!messageId && !process.env.DISCORD_WEBHOOK_URL) return;
  await admin.from('dungeon_lfg').update({
    discord_message_id: messageId,
    discord_alerted: !!messageId,
  }).eq('id', post.id);
  if (!messageId || mentions.length === 0) return;
  await admin.from('lfg_alerts').insert(mentions.map(mention => ({
    lfg_id: post.id,
    user_id: mention.userId,
    character_id: mention.characterId,
    channel: 'discord',
  })));
}

async function matchedDiscordMentions(admin: Admin, post: {
  id: string;
  user_id: string;
  dungeon_slug: string;
  needs: Needs;
  current_group: Group;
}) {
  const dungeon = getDungeon(post.dungeon_slug);
  if (!dungeon) return [];
  const prefRes = await admin
    .from('notification_prefs')
    .select('user_id, match_character_ids')
    .eq('discord_mentions', true);
  if (prefRes.error || !prefRes.data?.length) return [];

  const prefs = prefRes.data as { user_id: string; match_character_ids: string[] | null }[];
  const userIds = prefs.map(pref => pref.user_id).filter(id => id !== post.user_id);
  if (userIds.length === 0) return [];

  const userRes = await admin.from('users').select('id, discord_id').in('id', userIds);
  const discordByUser = new Map<string, string | null>(
    ((userRes.data ?? []) as { id: string; discord_id: string | null }[]).map(row => [row.id, row.discord_id]),
  );

  let charRows = await admin
    .from('characters')
    .select('id, claimed_by, name, last_name, class, level, is_main, roles')
    .in('claimed_by', userIds);
  if (charRows.error && /roles/i.test(charRows.error.message ?? '')) {
    charRows = await admin
      .from('characters')
      .select('id, claimed_by, name, last_name, class, level, is_main')
      .in('claimed_by', userIds);
  }
  if (charRows.error || !charRows.data) return [];

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentRes = await admin
    .from('lfg_alerts')
    .select('user_id')
    .eq('channel', 'discord')
    .gte('sent_at', since)
    .in('user_id', userIds);
  const priorRes = await admin
    .from('lfg_alerts')
    .select('user_id')
    .eq('lfg_id', post.id)
    .eq('channel', 'discord');

  const recentCounts = new Map<string, number>();
  for (const row of (recentRes.data ?? []) as { user_id: string }[]) {
    recentCounts.set(row.user_id, (recentCounts.get(row.user_id) ?? 0) + 1);
  }

  const chars: MentionChar[] = (charRows.data as Array<{
    id: string;
    claimed_by: string;
    name: string;
    last_name: string | null;
    class: string;
    level: number;
    is_main: boolean;
    roles?: string[] | null;
  }>).map(row => ({
    id: row.id,
    userId: row.claimed_by,
    discordId: discordByUser.get(row.claimed_by) ?? null,
    name: fullName(row.name, row.last_name),
    className: row.class,
    level: row.level,
    isMain: row.is_main,
    savedRoles: row.roles ?? null,
  }));

  const group = normalizeGroup(post.current_group);
  return discordMentions({
    posterId: post.user_id,
    chars,
    allowedUserIds: new Set(userIds),
    matchIdsByUser: new Map(prefs.map(pref => [pref.user_id, pref.match_character_ids])),
    dungeon,
    needs: post.needs,
    groupCounts: { tank: group.tank.length, healer: group.healer.length, dps: group.dps.length },
    already: new Set(((priorRes.data ?? []) as { user_id: string }[]).map(row => row.user_id)),
    recentCounts,
    cap: DISCORD_DAILY_CAP,
  });
}

export function groupIsFull(needs: Needs, group: Group): boolean {
  return isGroupFull(needs, group);
}

export function signupRole(role: string): LfgRole | null {
  if (role === 'Tank' || role === 'Healer' || role === 'DPS') return role;
  return null;
}

export { roleKeyOf };
