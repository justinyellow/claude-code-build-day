# Safe meetup map

**Track:** Everyday (for events)
**Status:** prototyping

## The feature
A stylised 3D map of Cape Town's East City and CBD around Roamwork Harrington
that shows **preferred meetup spots** — public, busy, staffed, well-lit places
picked by the hosts — and walks you there along real streets. Rotate it a full
360°, tilt it from flat plan to 3D, tap a spot to get a route and a walk time.

Complements [Find](3d-map-directions.md), which is indoors. This is for
"let's continue this over coffee" — where do we go?

## Why Fable 5.1
Built for Fable and Claude events — see [APP.md](../APP.md). Visitors to a
meet-up don't know the city; the people who do are the hosts. This puts the
hosts' judgement on a map instead of leaving it in a WhatsApp thread.

## Demo in 2 minutes
Open the map. Spin it. Tap Truth Coffee — the route lights up along Barrack
Street, "4 min walk, open until 18:00". Tap the Waterfront — "23 min, take
MyCiTi after dark". Show the green precincts and the note on how they
were chosen.

## Scope
- In: hand-drawn SVG map of CBD / East City, CSS 3D extrusions, 360 rotate +
  tilt, curated spots with hours and "why here", street-following route, walk
  time. Zero dependencies, runs from `file://` with wifi off.
- Out: real map tiles, GPS, live location sharing, **any "danger zone"
  overlay** — we have no offline crime data we'd trust, and drawing red over
  real neighbourhoods from memory is worse than nothing. Positive framing
  only: where to go, not where not to.

## Open questions
- Is this a fifth tab in Kinnect or a standalone page? Prototype is
  standalone; wiring a tab means editing `index.html` (base-owned).
- Spots and hours are hardcoded from memory — hosts should check them.
