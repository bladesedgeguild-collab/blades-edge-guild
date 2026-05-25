# TASK: Add character art to Oath Is Sealed cinematic

## Overview
46 transparent PNG character wireframe files have been added to public/images/characters/.
Naming convention: {Race}_{Class}_{M|F}.png
Example: Draenei_Shaman_F.png, Human_Warrior_M.png, NightElf_Druid_F.png

These gold glowing lineart figures on transparent backgrounds must flank the
wax seal on the Oath Is Sealed cinematic, selected by the user's race and class,
showing both M and F versions. They sit directly on the existing amber gradient
background — no background manipulation needed.

---

## Available character combinations

All files follow {Race}_{Class}_{M|F}.png:

Draenei: Hunter, Mage, Paladin, Priest, Shaman, Warrior (M+F each)
Dwarf: Hunter, Paladin, Priest, Rogue, Warrior (M+F each)
Gnome: Lock (Warlock), Mage, Rogue, Warrior (M+F each)
Human: Lock (Warlock), Mage, Paladin, Priest, Rogue, Warrior (M+F each)
NightElf: Druid, Priest, Rogue (M+F each)

Note: Warlock files may be named with "Lock" abbreviation (e.g. Gnome_Lock_F.png).
Check actual filenames in public/images/characters/ before coding the lookup.

---

## Step 1 — Character image lookup utility

Create lib/character-art.ts:

```ts
const RACE_MAP: Record<string, string> = {
  'Night Elf': 'NightElf',
  'NightElf': 'NightElf',
  'Draenei': 'Draenei',
  'Dwarf': 'Dwarf',
  'Gnome': 'Gnome',
  'Human': 'Human',
};

const CLASS_MAP: Record<string, string> = {
  'Warlock': 'Lock',
  'Hunter': 'Hunter',
  'Mage': 'Mage',
  'Paladin': 'Paladin',
  'Priest': 'Priest',
  'Rogue': 'Rogue',
  'Warrior': 'Warrior',
  'Shaman': 'Shaman',
  'Druid': 'Druid',
};

export function getCharacterArt(race: string, characterClass: string): {
  male: string;
  female: string;
} | null {
  const racePart = RACE_MAP[race] ?? race.replace(' ', '');
  const classPart = CLASS_MAP[characterClass] ?? characterClass;
  return {
    male: `/images/characters/${racePart}_${classPart}_M.png`,
    female: `/images/characters/${racePart}_${classPart}_F.png`,
  };
}
```

Verify actual filenames match. Update CLASS_MAP if abbreviations differ.

---

## Step 2 — Layout

Find the oath cinematic component. Add two figure slots flanking the wax seal:

```
[FIGURE LEFT]     [WAX SEAL + TEXT]     [FIGURE RIGHT]
```

Which side is M vs F is randomized on mount (50/50):

```tsx
import { getCharacterArt } from '@/lib/character-art';

const art = getCharacterArt(character.race, character.class);
const [maleOnRight, setMaleOnRight] = useState(true);
useEffect(() => { setMaleOnRight(Math.random() > 0.5); }, []);

const leftFigure  = maleOnRight ? art?.female : art?.male;
const rightFigure = maleOnRight ? art?.male   : art?.female;
```

Render each figure as a plain <img> or Next.js <Image>:
- No background color
- No mix-blend-mode
- No filter
- The transparent PNG sits naturally on the amber gradient background

Size: figures fill roughly 60-70% of the cinematic panel height.
Align feet toward the bottom of the cinematic area.
On mobile (< 768px): hide both figures, keep seal centered.

If getCharacterArt returns null or the file doesn't exist for the combo,
render nothing in the figure slots — no broken image icons.
Use onError on the img tag to hide it if the file is missing.

---

## Step 3 — Animation sequence

Do NOT touch the existing wax seal animation (be-stamp keyframe) or ember
particles. Only add new animations for the figure slots.

All new animations must use animation-fill-mode: both — never 'forwards'.

### Entrance: fires after the seal stamps

```css
@keyframes be-figure-rise {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Apply with a delay that starts after the wax seal animation completes.
Left figure enters slightly before right for a staggered feel.

### Idle float: starts after entrance completes

```css
@keyframes be-figure-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}
```

Duration: 4s, ease-in-out, infinite, animation-fill-mode: both.
Chain it after the entrance using animation-delay equal to entrance duration.

---

## Step 4 — Pass race/class through to cinematic

Confirm the oath cinematic receives race and class for both onboarding paths:

Path A (returning member): character already has race + class in public.characters.
Pass these to the cinematic component.

Path B (new member): user entered race + class in the form. Confirm these are
in state when the cinematic renders and passed through as props.

---

## Verification

1. New member onboarding as Dwarf Rogue
   → Oath screen shows Dwarf_Rogue_F.png and Dwarf_Rogue_M.png flanking the seal
2. New member onboarding as Draenei Shaman
   → Shows Draenei_Shaman_F.png and Draenei_Shaman_M.png
3. Returning member onboarding
   → Shows correct figures for their character's race/class
4. Figures fade/rise in after the seal stamps
5. Figures float gently after entrance
6. Refresh oath screen multiple times — M/F sides swap randomly
7. Mobile view — figures hidden, seal centered
8. Race/class with no art file → no broken image, seal only

---

## Do not touch
- be-stamp keyframe — do not modify
- Ember particle effect — do not modify
- animation-fill-mode: both on ALL existing animations — never change to forwards
- Oath screen text, seal size, or amber background gradient
- Any page outside the oath cinematic component
