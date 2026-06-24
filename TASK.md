# TASK: Mobile Hero — Push Title Lower

## One change only

Find the hero content container on mobile. It currently has `padding-bottom: 40px`.

Increase it so the title and subtitle sit much closer to the very bottom edge
of the hero image. Try `padding-bottom: 8px` with `justify-content: flex-end`
so the content is pinned as low as possible.

Also reduce the `gap` between the title block and the button from `16px` to `8px`
so they stay tightly grouped as a unit at the bottom.

```css
@media (max-width: 767px) {
  .hero-content {          /* use actual class name from codebase */
    justify-content: flex-end;
    padding-bottom: 8px;
    gap: 8px;
  }
}
```

Nothing else changes. Desktop untouched.

---

```bash
npm run build
git add -A
git commit -m "fix: mobile hero title pinned lower"
git push origin main
```

---

## Change 5: Mobile hero — move "New? Start Here" button up

Find the green "New to Blådes Edge? Start Here" CTA button in the landing page
hero section. On mobile it is sitting too low, overlapping content below and
blocking too much of the hero image.

Move it up so it sits snug just below the guild title text block with minimal
gap between them — they should feel like one grouped unit in the top-right
of the hero on mobile.

```css
@media (max-width: 767px) {
  .hero-cta-button,
  [class*="start-here"],
  [class*="recruit-cta"] {
    margin-top: 8px;   /* tight gap below the title */
    margin-bottom: 0;
  }
}
```

If the button is positioned absolutely, reduce its `top` value or increase its
`bottom` value so it floats up closer to the title. The goal is:

```
[ Blådes Edge                    ]
[ Est. 2023 · TBC · Dreamscythe ]
[ New to Blådes Edge? Start Here ]  ← snug below, no big gap
[                                ]
[      hero image breathes here  ]
[                                ]
```

Grep to find the exact element:
```bash
grep -r "Start Here\|start-here\|recruit.*cta\|NewMember\|green.*button" \
  app/(public)/ components/ --include="*.tsx" -l
```

Desktop layout of this button is unchanged.

---

## Change 6: Revert subtitle abbreviation on desktop

The previous task changed "Burning Crusade Classic" to "TBC" everywhere.
Revert that — "TBC" should only appear on mobile. Desktop should keep the
full text.

Find the subtitle string in the hero component. Make it conditional:

```tsx
// Use full text on desktop, abbreviated on mobile via CSS
// Keep ONE string in the component — the full version:
"Est. 2023 · Burning Crusade Classic · Dreamscythe Alliance"

// Then in the mobile CSS, hide this element and show a mobile-only element:
```

Implementation — two spans, one per breakpoint:

```tsx
{/* Desktop subtitle — full text */}
<span className="hero-subtitle-desktop">
  Est. 2023 · Burning Crusade Classic · Dreamscythe Alliance
</span>

{/* Mobile subtitle — abbreviated */}
<span className="hero-subtitle-mobile">
  Est. 2023 · TBC · Dreamscythe Alliance
</span>
```

```css
.hero-subtitle-mobile { display: none; }

@media (max-width: 767px) {
  .hero-subtitle-desktop { display: none; }
  .hero-subtitle-mobile { display: block; }
}
```

This way desktop always shows the full string and mobile shows the short one.

---

## Updated build and deploy

```bash
npm run build
git add -A
git commit -m "fix: active guildies, mobile hero title, start here button, subtitle desktop/mobile split"
git push origin main
```

## Additional checklist items
- [ ] "New to Blådes Edge? Start Here" button sits snug below title on mobile
- [ ] Button does not overlap content below on mobile
- [ ] Desktop hero subtitle reads "Est. 2023 · Burning Crusade Classic · Dreamscythe Alliance"
- [ ] Mobile hero subtitle reads "Est. 2023 · TBC · Dreamscythe Alliance"
- [ ] Desktop layout of hero completely unchanged
