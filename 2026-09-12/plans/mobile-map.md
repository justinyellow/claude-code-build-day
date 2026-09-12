# Find — mobile map

**Track:** Everyday (for events)
**Status:** parked

> **Needs network + backend at runtime; post-event.** Streamed tiles, HTTPS
> geolocation and shared-location delivery all need the network, which
> [#2](../APP.md) disqualifies for build day. Parked as a direction, not a
> today plan. The offline alternative is [find-map](find-map.md).

## The feature
A Life360-style map of the **Western Cape**, centred on Cape Town, showing
people and event markers. A top-down 2D view that can tilt into a 3D view,
built for a phone.

## Why Fable 5.1
Built for Fable and Claude events — see [APP.md](../APP.md).

## Demo in 2 minutes
Open the map on a phone, pan around Cape Town, tap an attendee avatar to open
a bottom sheet, then switch 2D → 3D with terrain and raised buildings.

## Scope
- In: 2D/3D map, attendee and event markers, locate me, opt-in shared location
- Out: routing and directions (needs a routing service), indoor floorplans,
  reliable background tracking

## Browser implementation and data

- Vanilla JavaScript, HTML and CSS. **MapLibre GL JS** renders the map in a
  canvas, with **MapTiler** as the proposed provider of hosted styles, vector
  tiles and terrain. Check provider coverage, credentials and usage limits
  before launch.
- Stream streets, place labels, building footprints and elevation from the
  provider as users move around — we do not model the Western Cape ourselves.
  People and event markers come from our app.
- One map instance for both views. 2D is a top-down camera on flat terrain; 3D
  tilts to ~60° and enables terrain and raised buildings where data exists.
  Preserve centre, markers and selection across the transition.
- Verify building-height coverage locally; detail differs between towns.
  Tilting the camera alone does not create building or terrain geometry.
- Extend the shared model with venue latitude/longitude and optional attendee
  shared location: latitude, longitude, accuracy, last-updated time.

## Mobile experience

- Full-screen map with touch pan, pinch zoom and rotation.
- Floating **2D/3D** and **locate me** buttons, search at the top.
- Tappable attendee avatars and event pins open an HTML/CSS bottom sheet with
  that person's or event's details.
- Find on an attendee profile centres the map on their shared location, when
  available.
- Start in 2D, load terrain on request, show buildings at close zoom, and group
  overlapping markers to keep the phone responsive.

## Location sharing

`navigator.geolocation.watchPosition()` over **HTTPS**, after the user grants
permission, updates their marker while the app is active. Sharing is opt-in: a
backend receives coordinates and distributes updates only to authorised
viewers. Users can stop sharing. Show accuracy and last-updated time so an old
position is not presented as live. The map stays usable if permission is
declined.

This targets **foreground** updates only — closing the app or locking the phone
can suspend them. Installing as a PWA improves launch, but does not make
continuous background tracking dependable. Reliable Life360-style background
tracking needs native mobile location capability.

## Build sequence

1. Load the Cape Town map with streets and labels.
2. Add the 2D/3D switch, terrain and available building geometry.
3. Add sample attendee avatars, event pins and selection cards.
4. Add locate me and foreground device-location updates.
5. Connect opt-in shared locations through a backend.

First demo is the map, view switching and sample markers.

## Connects to
- The offline, no-network take on the same surface is [find-map](find-map.md)
- Targets come from [Meet](social-meetup.md) and [Ask](question-router.md)
- Venue-scale wayfinding is [3d-map-directions](3d-map-directions.md)

## References
- [MapLibre 3D buildings](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/)
- [MapTiler 3D maps](https://www.maptiler.com/maps/3d/)
- [browser geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
