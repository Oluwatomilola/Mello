# Contributing to Mellocoin

Thanks for considering a contribution! Mellocoin is an open hackathon project and we welcome PRs.

## Getting started

1. Fork & clone the repo
2. `bun install`
3. `anchor build && anchor test`
4. `bun run dev`

## Branching

- `main` — stable
- `feat/*` — new features
- `fix/*` — bug fixes

## Commit style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(escrow): add token escrow CPI
fix(ui): handle wallet disconnect in dashboard
docs: update PDA layout diagram
```

## Pull requests

- Keep PRs focused and small
- Include screenshots for UI changes
- Run `anchor test` before requesting review
- Update docs in `/docs` when behavior changes

## Code of conduct

Be excellent to each other.
