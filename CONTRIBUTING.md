# Contributing Guide

Thanks for your interest in contributing to Weather Terminal!

## Development Setup

- Node.js: ^20.19 or >=22.12
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Lint with fixes: `npm run lint`

## Branching

- Create a feature branch from `main`: `feature/<short-title>`
- Keep PRs focused and small when possible
- Reference issues in commit messages (e.g., `fix:`, `feat:`)

## Code Style

- Use TypeScript and Vue 3 Composition API
- Prefer small, focused components
- Keep Tailwind utility classes readable and consistent
- Run the linter before pushing

## Tests & Manual QA

- Smoke test search (valid/invalid inputs, cancellation) 
- Verify unit toggle works without refetch
- Check forecast date rendering and precipitation bar
- Confirm no vertical page scroll; terminal pane scrolls internally only

## Security

- Do not commit API keys; use `.env`
- Avoid logging secrets

## PR Checklist

- [ ] Linted and built locally
- [ ] Screenshots for UI changes (if applicable)
- [ ] Updated docs (README/TECH_SPEC) if behavior changed
- [ ] Clear description of the change and rationale
