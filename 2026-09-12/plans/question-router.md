# Ask — Question router

**Owner:** Justin
**Track:** Everyday (for events)
**Status:** idea

## The feature
You ask a question at an event and it goes to whoever can actually answer it —
matched on **expertise** tags, not on who's holding the microphone. The right
person is often in the audience, not on stage.

Routing is schedule-aware: it won't interrupt someone who is presenting, and it
knows who is in the room right now.

## Why Fable 5.1
Built for Fable and Claude events — see [APP.md](../APP.md).

## Demo in 2 minutes
Ask a question from one phone. Watch it land on the right expert's phone —
someone who was never on the programme. Answer comes back.

## Scope
- In: ask a question, route to an expert by expertise, deliver the answer back
- Out: threads, search, moderation, anything that isn't one question → one expert

## Connects to
- An answered question earns the expert **credits** ([Thank](compute-as-reward.md))
- The expert who answered you becomes a suggested connection ([Meet](social-meetup.md))
