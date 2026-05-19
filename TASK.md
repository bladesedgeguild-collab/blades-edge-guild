# Current Task: Landing Page Refinements

## Overview
Refine the landing page layout based on visual feedback. Three main areas of change:
hero section, brotherhood section, and CTA section.

---

## Change 1 — Hero Section: Remove headline, move identity to bottom-right

### Remove:
- The large "BLÅDES EDGE" text that overlaps the center of the hero painting
- The tagline "EST. 2023 · BURNING CRUSADE CLASSIC · DREAMSCYTHE ALLIANCE" from center

### Add instead — bottom-right corner overlay:
Position a small identity block in the BOTTOM-RIGHT corner of the hero image.
It should sit below where the portal green glow is in the painting.
Style it as a semi-transparent dark panel with gold border, like a guild nameplate.

Content of the nameplate:
- Guild crest SVG (small, 48px) — same sword/shield SVG from login page
- "Blådes Edge" in Cinzel Decorative, #c9961a, ~1.8rem
- "Burning Crusade Classic · Dreamscythe" in Cinzel, #f0e6c8, ~0.75rem, letter-spaced
- "Est. 2023" in Crimson Pro italic, #8a7a5a, ~0.7rem

Position: absolute, bottom: 2rem, right: 2rem
Background: rgba(13, 11, 7, 0.75)
Border: 1px solid #3d2e15
Padding: 1rem 1.25rem
Border-radius: 4px
Backdrop-filter: blur(4px)

### Keep in hero:
- Return meter (move it to center-bottom of hero, above the gradient fade)
- The gradient overlay fading to dark at bottom

### Add — login prompt below nameplate or just above it:
A small "Register your return →" link button in the bottom-right area
just above or part of the nameplate block.
Style: subtle, gold text, underline on hover, Cinzel font
Links to /login

---

## Change 2 — Brotherhood Section: Flanking columns beside guild image

Replace the current layout (image then cards below) with a three-column layout:

### Layout structure:
[LEFT COLUMN] [CENTER: GUILD IMAGE] [RIGHT COLUMN]

Center column: guild-photo.png, same styling as before, takes ~60% of width
Left column: ~20% width, overlaps the left edge of the image slightly (negative margin)
Right column: ~20% width, overlaps the right edge of the image slightly

On mobile: stack vertically, image first, then left content, then right content

### Left column — "Answered the Call":
Heading: "Answered the Call" in Cinzel, portal green #1aff6e, small caps, ~0.85rem
Subtext: "{returned} have returned" in Crimson Pro, #8a7a5a

Then a scrolling/animated name display:
- A vertical list of character names that have status = 'returned'
- Since currently 0 are returned, show placeholder names from the roster with a note
- Actually: fetch characters where status = 'returned', if empty show empty state:
  "Be the first to answer." in Crimson Pro italic, #8a7a5a
- When there ARE returned members: show their names in a slow CSS scroll animation
  (marquee-style but vertical, using CSS animation keyframes)
- Each name in Cinzel font, colored by their class color
- Names repeat/loop if fewer than 10

Left column background: linear-gradient from transparent to rgba(26,18,8,0.9)
Border-right: 1px solid #3d2e15

### Right column — "Still MIA":
Heading: "Still MIA" in Cinzel, #c9961a, small caps, ~0.85rem  
Subtext: "{mia_count} awaiting the call" in Crimson Pro, #8a7a5a

Then a scrolling vertical name display of MIA characters:
- Fetch characters where status = 'mia', limit to names only
- Same vertical scroll animation as left column but slower
- Names in muted #8a7a5a color (greyed out to represent MIA)
- Names cycle through continuously

Right column background: linear-gradient from transparent to rgba(26,18,8,0.9)
Border-left: 1px solid #3d2e15

### Roster cards below the three-column layout:
Keep the 10-character preview cards but restyle them:

New card design — more name-forward:
- Character NAME much larger: Cinzel font, 1.1rem, #f0e6c8, full width top of card
- Below name: class color dot + class name in class color, bold
- Right side of name row: level badge "Lvl 60" in small Cinzel
- Bottom row: rank name on left, MIA/Returned badge on right
- MIA: text only "#8a7a5a · MIA" no background badge
- Returned: small green dot + "Returned" in #1aff6e
- Card left border: 3px solid [class color]
- Card background: #1a1208
- Hover: translateY(-3px) + gold glow shadow
- No card border radius change on hover

Heading above cards: "Roster Preview" in Cinzel, gold, centered
Subtext: "Log in to see the full roster and claim your character." in Crimson Pro italic

---

## Change 3 — CTA Section: One-line headline + dual login

### Headline fix:
"YOUR GUILD NEEDS YOU." must fit on ONE LINE.
Reduce font size until it fits: try clamp(2rem, 5vw, 4rem)
Do not let it wrap to two lines on any screen wider than 480px.

### Returning member copy (not newbie register language):
Replace current copy with:

Primary text (large, Cinzel): "YOUR GUILD NEEDS YOU."
Secondary text (Crimson Pro, #8a7a5a, italic):
"We've been holding your spot. Log in to reclaim your place in the roster."

Small note below both login options in Crimson Pro, #8a7a5a, ~0.8rem:
"New to Blådes Edge? Create an account and introduce yourself to the guild."

### Dual login layout:
Show both login options side by side (stack on mobile):

Left option:
- "Continue with Discord" button — keep existing Discord OAuth, same blurple color
- Subtext: "Fastest way back" in tiny Crimson Pro

Right option — email quick-login:
- Email input field (dark styled, gold border on focus)
- Password input field
- "Sign In" button in gold (#c9961a) with dark text
- "New here? Create account" small link below
- "Forgot password?" small link below that

Both options separated by a vertical divider with "or" 

All of this in a dark panel: background #1a1208, border #3d2e15, padding 2rem, max-width 600px centered

---

## What NOT to change:
- All auth logic and functionality
- Database queries
- Middleware and route protection
- The onboarding wizard
- The navbar
- The login page at /login (separate from this landing page CTA)
- Mobile responsiveness should be maintained

## After changes:
1. npm run build
2. Fix any TypeScript errors
3. git add -A && git commit -m "feat: landing page refinements — nameplate hero, flanking columns, dual login CTA" && git push origin main
