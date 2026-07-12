# NaijaRewind — Phase 2 Roadmap Notes

Not being built now. Documented here so it isn't lost the next time a long
conversation buries it. Revisit only once phase 1 (Nollywood movies) has
real licensed content live and is actually working end to end.

## The idea (raised 2026-07-11)

Expand beyond Nollywood movies into a broader "Nigerian cultural memory"
platform, under the same Legacy Fund / honoring-the-people-who-built-it
mission that already exists for veteran actors:

- **News archive** — classic/memorable Nigerian news clips: major
  announcements, significant breaking news moments.
- **Documentaries** — potentially its own standalone page/section, not just
  a subcategory.
- **Sports & Super Eagles** — legendary matches (e.g. Atlanta '96), a
  "Super Eagles Legends" honor-roll section mirroring the existing Veteran
  Actors / Legacy Fund pattern (short clips per legend, same honor-without-
  requiring-rights philosophy).
- **General sports/athletes** — broader section documenting memorable
  national sporting moments beyond just football.

## Why this isn't being built now

1. **Rights get harder, not easier, outside Nollywood.** Old Nollywood
   producers are often small and not well set up to enforce copyright,
   which is part of why licensing conversations are realistic right now.
   Sports footage (broadcasters, IOC, CAF) and news archives (TV stations,
   wire services) tend to be controlled by organizations with real legal
   departments and real licensing costs — a materially harder rights
   landscape, multiplied across three new verticals.
2. **Focus.** Zero real movies are live yet and the platform name is still
   unresolved. Adding three more content categories before proving the
   first one works is scope expansion at the wrong time.

## Why it's still worth keeping

- Thematically stronger than "old movies" alone — "preserving Nigeria's
  cultural memory" is a bigger, more compelling mission, and ties directly
  into the existing Legacy Fund concept.
- **Naming implication:** if this is genuinely the long-term vision, it
  favors a broader heritage-style brand name over a Nolly-specific one
  (e.g. the earlier LEGACI concept) — a name like "NollyThrowback" doesn't
  make sense once the platform streams Super Eagles matches. Worth
  factoring in whenever the name gets locked, even if phase 2 is years out.

## How it'd likely get built, when the time comes

The existing retro-ads architecture (`retro_content`/`ads` tables +
YouTube-embed pattern already used in `pages/retro-ads.js`) already
supports this pattern cheaply — categorized, YouTube-hosted clips with zero
Bunny storage/bandwidth cost. A "Legends & Moments" hub with tabs
(Documentaries / News Moments / Sports Legends) would reuse this pattern
rather than needing new infrastructure. Reasonable low-cost way to test
interest before committing to real licensing conversations in these new
verticals: embed official/legitimate existing YouTube uploads first, see
if it gets engagement, then decide whether formal licensing is worth
pursuing.
