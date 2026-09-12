# Kinnect

**Track:** Everyday (for events)

**Kinnect** is an event companion for Fable and Claude community meet-ups. The premise: the value of an event
is the people in the room, and most of it goes unrealised — you don't know who
knows what, you can't find them, and the one person who could answer your
question never hears it.

The app closes that loop:

| | Feature | Question it answers |
|---|---|---|
| **Ask** | [Question router](plans/question-router.md) | Who in this room can answer this? |
| **Meet** | [Social meet-up](plans/social-meetup.md) | Who should I be talking to? |
| **Find** | [3D map directions](plans/3d-map-directions.md) | Where are they, and how do I get there? |
| **Thank** | [Compute as reward](plans/compute-as-reward.md) | How do I repay the person who helped? |

Ask → Meet → Find → Thank is one flow, not four apps. A question finds an
expert, the expert becomes a person worth meeting, the map gets you to them,
and the reward closes it out.

## Shared model

Every feature reads and writes the same few things. Don't invent parallel
versions of these.

- **Attendee** — a person at the event. Has a profile and a set of
  **expertise** tags (how they're routed to, and how they're matched).
- **Event** — the thing everyone is at. Has a schedule (sessions with times)
  and a **venue** (spaces with locations).
- **Question** — asked by an attendee, routed to one or more attendees,
  answered or unanswered.
- **Credits** — compute granted to an attendee for contributing. Earned by
  answering, spent or gifted.

## Why Fable 5.1

Built for Fable and Claude events specifically — the audience is exactly these
rooms. Every attendee already has Claude, already has expertise worth routing
to, and already loses most of it to the fact that nobody knows who knows what.

## Find: mobile map

The initial map covers the **Western Cape**, starting centred on Cape Town.
The intended experience is a Life360-style map with people and event markers:
a top-down **2D view** that can switch to a tilted **3D view**. This replaces
the indoor venue-model scope in the earlier [Find plan](plans/3d-map-directions.md).
That plan and the existing floorplan issues still need to be aligned.

### Browser implementation and data

- Build with **vanilla JavaScript, HTML, and CSS**. Use **MapLibre GL JS**
  to render the map in a canvas, with **MapTiler** as the proposed provider
  of hosted styles, vector tiles, and terrain. Check provider coverage,
  credentials, and usage limits before launch.
- Stream streets, place labels, building footprints, and elevation from the
  provider as users move around. We do not need to collect or model the
  Western Cape ourselves. People and event markers come from our app.
- Keep one map instance for both views. In 2D, use a top-down camera and
  flat terrain. In 3D, tilt the camera to around 60 degrees and enable
  terrain and raised buildings where data is available. Preserve the map
  centre, markers, and selection during the transition.
- Verify building-height coverage locally; detail may differ between towns.
  Tilting the camera alone does not create building or terrain geometry.
- Extend the shared model with venue latitude/longitude and optional attendee
  shared location: latitude, longitude, accuracy, and last-updated time.

### Mobile experience

- Full-screen map with touch pan, pinch zoom, and rotation.
- Floating **2D/3D** and **locate me** buttons, with search at the top.
- Tappable attendee avatars and event pins open an HTML/CSS bottom sheet
  showing the selected person's or event's details.
- Find on an attendee profile centres the map on their shared location,
  when available.
- Start in 2D, load terrain when requested, show buildings at close zoom,
  and group overlapping markers to keep the phone experience responsive.

### Location sharing

Use `navigator.geolocation.watchPosition()` over **HTTPS**, after the user
grants location permission, to update their marker while the app is active.
Sharing with others is opt-in: a backend receives coordinates and distributes
updates only to authorised viewers. Users can stop sharing. Display accuracy
and last-updated time so an old position is not presented as live. The map
remains usable if location permission is declined.

The browser version targets **foreground location updates**. Closing the app
or locking the phone can suspend updates. Installing it as a PWA can improve
the launch experience, but does not make continuous background tracking
dependable. Reliable Life360-style background tracking would require native
mobile location capability.

### Build sequence

1. Load the Cape Town map with streets and labels.
2. Add the 2D/3D switch, terrain, and available building geometry.
3. Add sample attendee avatars, event pins, and selection cards.
4. Add locate me and foreground device-location updates.
5. Connect opt-in shared locations through a backend.

The first demo is the map, view switching, and sample markers. Road or walking
directions are a separate follow-up requiring a routing service; map tiles
alone do not calculate routes. Indoor floorplans are outside this prototype.

References: [MapLibre 3D buildings](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/),
[MapTiler 3D maps](https://www.maptiler.com/maps/3d/), and
[browser geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition).

## Design constraints

- Works for everyone in the room — young, old, technical, non-technical. No
  jargon, no assumed tooling, free to use.
- Deliberately small. Each feature does one thing; we'd rather cut a feature
  than half-build two.
