'use client'

import { useState } from 'react'
import { memberLevel, memberName, openCounts, partyXpWarning, type Group, type Needs } from '@/lib/lfg-group'
import type { RoleKey } from '@/lib/roles'

type UserChar = { id: string; name: string; level: number; class: string; is_main: boolean }

export function GroupBoard({
  lfgId,
  needs,
  group,
  recommendedLevelMax,
  isLoggedIn,
  isOwner,
  userChars,
  onChange,
}: {
  lfgId: string
  needs: Needs
  group: Group
  recommendedLevelMax: number
  isLoggedIn: boolean
  isOwner: boolean
  userChars: UserChar[]
  onChange: (group: Group) => void
}) {
  const [joiningRole, setJoiningRole] = useState<RoleKey | null>(null)
  const [joinCharId, setJoinCharId] = useState(userChars.find(character => character.is_main)?.id ?? userChars[0]?.id ?? '')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = openCounts(needs, group)
  const warning = partyXpWarning(
    (['tank', 'healer', 'dps'] as RoleKey[]).flatMap(role => group[role].map(memberLevel)),
    recommendedLevelMax,
  )

  async function confirmJoin(role: RoleKey) {
    if (!joinCharId) return
    setJoining(true)
    setError(null)
    try {
      const res = await fetch(`/api/dungeons/lfg/${lfgId}/join`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, characterId: joinCharId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not join.')
        return
      }
      onChange(data.current_group)
      setJoiningRole(null)
    } finally {
      setJoining(false)
    }
  }

  return (
    <div>
      <div className="lfg-roles-2col" style={{ marginBottom: '1rem' }}>
        <div className="lfg-roles-left">
          <RoleColumn
            label="Tank"
            role="tank"
            members={group.tank}
            cap={needs.tank}
            joiningRole={joiningRole}
            canJoin={!isOwner && isLoggedIn && userChars.length > 0 && open.tank > 0}
            onJoin={() => setJoiningRole('tank')}
            joinCharId={joinCharId}
            userChars={userChars}
            onChar={setJoinCharId}
            onConfirm={() => confirmJoin('tank')}
            onCancel={() => setJoiningRole(null)}
            joining={joining}
          />
          <RoleColumn
            label="Healer"
            role="healer"
            members={group.healer}
            cap={needs.healer}
            joiningRole={joiningRole}
            canJoin={!isOwner && isLoggedIn && userChars.length > 0 && open.healer > 0}
            onJoin={() => setJoiningRole('healer')}
            joinCharId={joinCharId}
            userChars={userChars}
            onChar={setJoinCharId}
            onConfirm={() => confirmJoin('healer')}
            onCancel={() => setJoiningRole(null)}
            joining={joining}
          />
        </div>
        <RoleColumn
          label="DPS"
          role="dps"
          members={group.dps}
          cap={needs.dps}
          joiningRole={joiningRole}
          canJoin={!isOwner && isLoggedIn && userChars.length > 0 && open.dps > 0}
          onJoin={() => setJoiningRole('dps')}
          joinCharId={joinCharId}
          userChars={userChars}
          onChar={setJoinCharId}
          onConfirm={() => confirmJoin('dps')}
          onCancel={() => setJoiningRole(null)}
          joining={joining}
        />
      </div>
      {error && <p className="lfg-xp-warning">{error}</p>}
      {warning && <p className="lfg-xp-warning">{warning}</p>}
    </div>
  )
}

function RoleColumn({
  label,
  role,
  members,
  cap,
  joiningRole,
  canJoin,
  onJoin,
  joinCharId,
  userChars,
  onChar,
  onConfirm,
  onCancel,
  joining,
}: {
  label: string
  role: RoleKey
  members: Group[RoleKey]
  cap: number
  joiningRole: RoleKey | null
  canJoin: boolean
  onJoin: () => void
  joinCharId: string
  userChars: UserChar[]
  onChar: (id: string) => void
  onConfirm: () => void
  onCancel: () => void
  joining: boolean
}) {
  const slots = Math.max(cap, members.length)
  const compact = slots > 5
  return (
    <div className={`lfg-role-block${role === 'dps' ? ' lfg-role-block--dps' : ''}`}>
      <div className="lfg-role-header">
        <span className="lfg-role-label">{label} ({members.length}/{cap})</span>
      </div>
      {compact ? (
        <div className="lfg-role-slot">
          {members.length > 0
            ? <span className="lfg-slot-name">{members.map(memberName).join(', ')}</span>
            : <span className="lfg-slot-need">NEED {cap}</span>}
          {canJoin && joiningRole !== role && (
            <button type="button" className="lfg-slot-need-btn" onClick={event => { event.stopPropagation(); onJoin() }}>Join as {label}</button>
          )}
        </div>
      ) : (
        Array.from({ length: slots }, (_, index) => {
          const member = members[index]
          const isNextEmpty = !member && index === members.length
          return (
            <div key={index} className="lfg-role-slot">
              {slots > 1 && <span className="lfg-dps-label">{label} {index + 1}:</span>}
              {member ? (
                <span className="lfg-slot-name">
                  {memberName(member)}
                  {memberLevel(member) != null ? ` (${memberLevel(member)})` : ''}
                </span>
              ) : joiningRole === role && isNextEmpty ? (
                <JoinPicker
                  prompt={`Who is joining as ${label}?`}
                  joinCharId={joinCharId}
                  userChars={userChars}
                  onChar={onChar}
                  onConfirm={onConfirm}
                  onCancel={onCancel}
                  joining={joining}
                />
              ) : canJoin && isNextEmpty ? (
                <button type="button" className="lfg-slot-need-btn" onClick={event => { event.stopPropagation(); onJoin() }}>NEED — Click to Join</button>
              ) : (
                <span className="lfg-slot-need">NEED</span>
              )}
            </div>
          )
        })
      )}
      {compact && joiningRole === role && (
        <JoinPicker
          prompt={`Who is joining as ${label}?`}
          joinCharId={joinCharId}
          userChars={userChars}
          onChar={onChar}
          onConfirm={onConfirm}
          onCancel={onCancel}
          joining={joining}
        />
      )}
    </div>
  )
}

function JoinPicker({
  prompt,
  joinCharId,
  userChars,
  onChar,
  onConfirm,
  onCancel,
  joining,
}: {
  prompt: string
  joinCharId: string
  userChars: UserChar[]
  onChar: (id: string) => void
  onConfirm: () => void
  onCancel: () => void
  joining: boolean
}) {
  return (
    <div className="lfg-assign-wrap" onClick={event => event.stopPropagation()}>
      <p className="lfg-assign-prompt">{prompt}</p>
      <select className="lfg-assign-select" value={joinCharId} onChange={event => onChar(event.target.value)}>
        {userChars.map(character => (
          <option key={character.id} value={character.id}>
            {character.is_main ? '★ ' : ''}{character.name} — Lvl {character.level} {character.class}
          </option>
        ))}
      </select>
      <div className="lfg-assign-btns">
        <button type="button" className="lfg-assign-confirm" onClick={onConfirm} disabled={joining}>{joining ? '…' : 'Confirm'}</button>
        <button type="button" className="lfg-assign-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
