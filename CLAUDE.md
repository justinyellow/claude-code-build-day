# Claude Code Build Day — repo rules

## The shape of the work

We are building **one app**. The ideas we generate are *features* of that app,
not competing projects. As a group we prototype a few features in parallel,
then select the one feature we take to the demo.

## Layout

```
<YYYY-MM-DD>/          one folder per build day
  README.md            event details, schedule, tracks, links
  APP.md               what the app is and the model features share
  plans/               one markdown file per feature idea
  app/                 the app itself
    features/<slug>/   a feature prototype
```

Everything for a build day stays inside that day's folder. Don't add
top-level folders.

## How we work

1. **Diverge first.** Feature ideas go in `<day>/plans/` — one file per idea,
   named `<slug>.md`. One idea per file. Don't overwrite someone else's idea
   file to replace their idea; add a new one.
2. **Prototype a few in parallel.** Each prototyped feature lives in its own
   `app/features/<slug>/` folder. Keep them independent while prototyping —
   no shared code between feature prototypes, no refactoring one to suit
   another, even if it looks duplicated.
3. **Then pick one.** After prototyping we select a single feature to demo.
   The others stay in the repo as-is; don't delete them.

## Plan files

Keep a plan short — readable in under a minute:

```markdown
# <Feature name>

**Track:** Delight | Breakthrough | Everyday
**Status:** idea | prototyping | selected | parked

## The feature
One or two sentences. What it does in the app.

## Why Fable 5.1
What makes this newly possible or newly good.

## Demo in 2 minutes
What we actually show on screen.

## Scope
- In:
- Out:
```

Set `Status:` as things move. Exactly one plan may be `selected`.

## Rules for Claude

- Ask which feature you're working in before writing code. Don't guess.
- Build day is a sprint: prototypes over polish. No test suites, no CI, no
  abstraction layers, no backwards compatibility. Delete rather than deprecate.
- Don't scaffold a feature folder until we've decided to prototype that plan.
- Don't merge, rank, or prune ideas unless asked — that's the group's call.
- Don't pull shared code out of feature prototypes unless asked.
- Work on a `feat/<feature-slug>` branch, not `main` — see `.cursor/rules/git.mdc`.
