# Design Brief: Tiled Cards + Tile Colors (for Mike)

**From:** Tricia (UI/UX Designer)  
**To:** Mike (Frontend Developer)  
**Goal:** Each section is its own card; use one complementing color per tile so the layout reads as a clear, attractive tiled dashboard.

---

## 1. Section = One Card

- **Hero** – Wrap headline + tagline in a single **glass card** (`.glass`, `rounded-3xl`, `p-8`). Optional: thin gradient accent bar at top of the card (same as reference accent bar).
- **Stat row** – Keep three **separate cards** in one grid (no wrapper). Each card: glass, `rounded-3xl`, `p-8`, colored top bar + **left border** in the same color (see colors below).
- **Recent activity** – One **glass card** (`.glass`, `rounded-3xl`, `p-8`) containing the "Recent activity" heading and list. Add a **left border** in the section color.
- **Quick actions** – One **glass card** (`.glass`, `rounded-3xl`, `p-8`) containing the "Quick actions" heading and 2×2 grid. Add a **left border** in the section color.
- **Status** – One **slim glass card** (`.glass`, `rounded-3xl`, minimal padding) with "All systems nominal" and timestamp. Add a **left border** in emerald.

**Nav** stays a bar (no card).

---

## 2. One Color Per Tile (left border + optional top bar)

Use a **left border** (`border-l-4`) in a complementing color per card. Keep opacity ~40–60% so the glass stays primary.

| Section           | Color   | Tailwind (border)        | Notes                    |
|------------------|---------|--------------------------|--------------------------|
| Hero card        | Sky     | `border-l-4 border-sky-500/50` | Or thin gradient bar at top |
| System Health    | Emerald | `border-l-4 border-emerald-500/60` | Top bar: accent or emerald |
| Network Load     | Purple  | `border-l-4 border-purple-500/60` | Top bar: purple           |
| IoT Integration  | Sky     | `border-l-4 border-sky-500/50`    | Top bar: sky; optional light border |
| Recent activity  | Sky/slate | `border-l-4 border-sky-500/40`  | Neutral activity         |
| Quick actions    | Amber   | `border-l-4 border-amber-500/50` | Suggests "action"        |
| Status bar       | Emerald | `border-l-4 border-emerald-500/60` | "All clear"            |

Stat cards: keep the existing **top accent bar** (`h-2 w-12` pill) in the same color as the left border (emerald, purple, sky). Hero card: optional thin gradient bar at top.

---

## 3. Layout and Spacing

- **Order:** Nav (bar) → Hero card → Grid of 3 stat cards → Row: Recent activity card (2/3) + Quick actions card (1/3) → Status card.
- **Gap:** `gap-6` between all cards.
- **Radius:** `rounded-3xl` on every card (hero, stat cards, Recent activity, Quick actions, status).
- **Padding:** `p-8` for hero and content cards; status card can use `py-3 px-6` or similar to stay slim.

---

## 4. Reference Alignment

- Nav: no card; `text-slate-400` links, `hover:text-sky-400`.
- Hero: one card with headline + tagline; tagline `text-slate-400`.
- Stat cards: `glass p-8 rounded-3xl`, top bar (`h-2 w-12`), title, `text-slate-400` description, mono stat. Add left border per table above.
- All cards use the same `.glass` base so the tiled look is consistent.

---

## 5. Implementation Checklist (Mike)

1. [ ] Wrap hero (headline + tagline) in a glass card; add `border-l-4 border-sky-500/50`; optional thin gradient bar at top.
2. [ ] Add left border to each stat card: emerald, purple, sky (see table). Keep existing top bars.
3. [ ] Ensure Recent activity and Quick actions are each one glass card with `rounded-3xl` and `p-8`; add left borders (sky, amber).
4. [ ] Make status a slim glass card with `rounded-3xl` and `border-l-4 border-emerald-500/60`.
5. [ ] Use `gap-6` between all cards; no extra wrapper around the three stat cards.
6. [ ] Verify all cards use `.glass` and `rounded-3xl` for a consistent tiled layout.
