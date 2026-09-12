# Meet — Social meet-up

**Owner:** Cameron
**Track:** Everyday (for events)
**Status:** idea

## The feature
Suggests who at this event you should be talking to, and gives you a reason
why. Built for everyone in the room — the non-technical attendee gets as much
out of it as the engineer, and it's free.

Matching runs on the same **expertise** tags the router uses, so the two
features feed each other rather than asking people to fill in two profiles.

## Why Fable 5.1
Built for Fable and Claude events — see [APP.md](../APP.md).

## Demo in 2 minutes
Open the app cold, get three people worth meeting and a one-line reason for
each.

## Scope
- In: attendee profiles, expertise tags, suggested connections with a reason
- Out: chat, friend graphs, anything that outlives the event

## Connects to
- Shares the **attendee**/expertise model with [Ask](question-router.md)
- Tap a suggestion to get walked to them ([Find](3d-map-directions.md))

## Open questions
- Does "tailored to all types of people" mean different UI per audience, or one
  UI that avoids jargon? Currently written as the latter.
