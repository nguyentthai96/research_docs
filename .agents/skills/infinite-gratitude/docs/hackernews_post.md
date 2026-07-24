# Show HN: Infinite Gratitude – Multi-agent research skill for Claude Code (made BY the skill!)

**GitHub**: https://github.com/washinmura/infinite-gratitude

---

## What is this?

A Claude Code skill that orchestrates **10 AI agents across 3 waves** to conduct deep research on any topic. Give it a question, and it returns 9 comprehensive reports.

The meta part? **This skill was used to research how to build itself.** We asked it "How do top AI research agents work?" and used those findings to improve its own architecture.

## How it works

```
Wave 1: 4 scouts explore different angles
Wave 2: 3 specialists dive deep into promising areas  
Wave 3: 3 synthesizers connect insights across reports
```

Each agent works independently, then passes findings to the next wave. No coordination overhead, just focused research.

## Why we built it

We run a small animal sanctuary in rural Japan (Washin Village) with 28 cats and dogs. We needed to research pet AI recognition, veterinary resources, and adoption best practices—but doing 10+ hours of research manually wasn't sustainable.

Now we ask a question before bed, wake up to 9 reports, and spend our time with the animals instead.

## Quick start

```bash
claude install washinmura/infinite-gratitude
```

Then in Claude Code:
```
/research "Your question here"
```

---

Built with love from Washin Village, Japan
