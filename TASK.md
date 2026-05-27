# TASK: My Roster page — design upgrade + character art in hero + larger alt button figures

## Reference
Two versions exist:
- Current: functional but sparse, missing design polish
- Design version (Skålbogg screenshot): the target aesthetic

Implement everything below to bridge the gap.

---

## Fix 1 — Hero section: add character art + spec + avatar + guild tag

### Character art in hero
The empty right side of the YOUR MAIN hero panel should show the two
matching character wireframes for the user's race + class.

Use the same getCharacterArt() utility from lib/character-art.ts.
Show both M and F versions side by side, bottom-aligned, in the right
portion of the hero panel. They should fill roughly 60-70% of the
hero panel height. No animation — static display only.

```tsx
const art = getCharacterArt(character.race, character.class);

// In the hero panel right side:
{art && (
  <div className="roster-hero-art">
    <img src={art.female} className="roster-hero-fig" alt="" />
    <img src={art.male}   className="roster-hero-fig" alt="" />
  </div>
)}
```

```css
.roster-hero-art {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 100%;
  opacity: 0.7;
}
.roster-hero-fig {
  height: 160px;
  width: auto;
  max-width: none;
}
```

### Spec line above character name
Above the large character name, show class + spec in small caps:
```
WARRIOR · PROTECTION
```
Spec comes from professions? No — spec is a separate concept.
For now, if no spec is stored, show just the class:
```
WARRIOR
```
Style: Cinzel, small, --be-muted color, letter-spacing wide

### Avatar circle
Left of the character name, show a circle avatar:
- Background: class color at 20% opacity
- Border: class color at 60% opacity  
- Text: first 2 initials of character name, in class color
- Size: 80px

### Guild tag
Below race/class/level line show:
`<Blådes Edge>` in --be-muted italic Spectral

### Edit Profile button
Top right of hero panel: small secondary button "Edit Profile →"
Links to /settings for now.

---

## Fix 2 — Vitals panel: match design version layout

The design version shows vitals as a clean label/value table on the left:

```
RACE          Dwarf
CLASS         • Warrior · Protection  
LEVEL         60
PROFESSIONS   Mining · Blacksmithing
GUILD RANK    [GUILD MASTER badge]
JOINED        Mar 13, 2019
```

Labels in Cinzel small caps, --be-muted
Values right-aligned in Spectral, --be-ink
Class dot colored by class color
Rank shown as a pill badge styled like rank name
Professions in --be-gold if present, "To Be Determined" italic if not

---

## Fix 3 — Alt cards: match design version style

Design version alt cards have:
- Left border accent in class color (4px solid)
- Character name in class color, Cinzel
- Class · Spec · Race · Level on second line
- Professions on right side of card
- Clean card background --be-bg-2

```css
.alt-card {
  background: var(--be-bg-2);
  border: 1px solid rgba(201, 150, 26, 0.15);
  border-left: 4px solid var(--class-color); /* set via inline style */
  border-radius: 6px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### Small + ADD ALT button in section header
The design version has a small "+ ADD ALT" button in the top right of
the Alts section header row, in addition to (or instead of) the big
card button. Keep BOTH — small button in header, big silhouette card below.

---

## Fix 4 — Add Alt button: larger figures, fill the rectangle better

The current figures are too small and leave too much empty space in the button.

Increase all figure heights and reduce negative margins slightly so they
spread out more within the button width:

```css
.alt-btn-figures {
  height: 180px;   /* was 140px */
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.alt-fig-1 { height: 110px; margin-right: -18px; z-index: 1; }
.alt-fig-2 { height: 145px; margin-right: -20px; z-index: 2; }
.alt-fig-3 { height: 178px; margin-right: -20px; z-index: 3; }
.alt-fig-4 { height: 158px; margin-right: -18px; z-index: 2; }
.alt-fig-5 { height: 118px; z-index: 1; }
```

Also increase button max-width to fill more of the page:
```css
.add-alt-btn {
  max-width: 680px;   /* was 480px */
  padding: 2.5rem 3rem;
}

.alt-btn-title {
  font-size: 1.4rem;  /* was 1.1rem */
}
```

---

## Fix 5 — Navbar

Design version shows: Hall · My Roster · Settings · Officers
Current version shows: Hall · My Roster · Dungeons · [user dropdown]

Add Settings as a nav link (between My Roster and Dungeons).
Keep Dungeons as disabled/muted for now.
Officers link only shows for role = officer/admin/gm.

---

## Verification
1. Log in as TestingYo — hero shows Draenei Shaman M+F art on right side
2. Avatar circle shows "TE" in shaman blue (#0070dd)
3. Guild tag shows <Blådes Edge>
4. Vitals panel matches design layout
5. Alt cards have class-colored left border
6. Add Alt button figures are noticeably larger and fill the rectangle
7. Small "+ ADD ALT" button appears in alts section header
8. Edit Profile → links to /settings

## Do not touch
- Oath cinematic
- Landing page
- Hall page
- animation-fill-mode: both on all animations
- Onboarding flow
