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

## Design constraints

- Works for everyone in the room — young, old, technical, non-technical. No
  jargon, no assumed tooling, free to use.
- Deliberately small. Each feature does one thing; we'd rather cut a feature
  than half-build two.
