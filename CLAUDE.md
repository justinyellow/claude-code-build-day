# Claude Code Build Day — repo rules

## Layout

```
<YYYY-MM-DD>/          one folder per build day
  README.md            event details, schedule, tracks, links
  plans/               one markdown file per idea
  <project-slug>/      code for a project we actually build
```

Everything for a build day stays inside that day's folder. Don't add
top-level folders for projects.

## How we work

1. **Diverge first.** Ideas go in `<day>/plans/` — one file per idea, named
   `<slug>.md`. Never more than one idea per file, and never edit someone
   else's idea file to replace their idea; add a new one.
2. **Build a couple in parallel.** As a group we prototype several plans at
   once, each in its own `<day>/<project-slug>/` folder. Keep them fully
   independent — no shared code between prototypes, no refactoring one to
   suit another.
3. **Then pick one.** After prototyping we select a single project to take
   to the demo. The others stay in the repo as-is; don't delete them.

## Plan files

Keep a plan short — it should be readable in under a minute:

```markdown
# <Idea name>

**Track:** Delight | Breakthrough | Everyday
**Status:** idea | prototyping | selected | parked

## The idea
One or two sentences.

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

- Ask which plan or project you're working in before writing code. Don't guess.
- Build day is a sprint: prototypes over polish. No test suites, no CI, no
  abstraction layers, no backwards compatibility. Delete rather than deprecate.
- Don't scaffold a project folder until we've decided to prototype that plan.
- Don't merge, rank, or prune ideas unless asked — that's the group's call.
- Commit to `main` directly. Small, frequent commits.
