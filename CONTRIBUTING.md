# Contributing

Thanks for your interest in improving this project.

## Before You Start

- Open an issue first for significant changes.
- Keep changes focused and small when possible.
- Do not include secrets or tokens in code, logs, tests, or screenshots.
- By contributing, you agree your contribution can be used under this repository's proprietary license terms.

## Development Setup

```bash
npm install
npm run dev
```

## Quality Checks

Run these before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Coding Guidelines

- Use TypeScript and keep imports at the top of files.
- Validate tool inputs with Zod where relevant.
- Prefer clear errors with actionable messages.
- Keep changes backward compatible unless explicitly discussed in an issue.

## Pull Request Process

1. Create a branch from `main`.
2. Make your change with tests where relevant.
3. Ensure all checks pass locally.
4. Open a PR using the provided template.
5. Respond to review feedback and update your PR.

## Commit Messages

All commits and PR titles **must** follow the
[Conventional Commits](https://www.conventionalcommits.org/) specification.
This is enforced automatically in CI.

### Format

```
type(optional-scope): short description
```

### Allowed types

`feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

### Examples

- `fix: handle empty quote responses`
- `feat: add account activity filters`
- `docs: clarify HTTP transport setup`
- `refactor(auth): simplify token refresh flow`

### What gets checked

| Check | Scope | Trigger |
|-------|-------|---------|
| **PR title** (semantic-pull-request) | PR title only | PR opened / edited / reopened |
| **Commit messages** (commitlint) | Every commit in the PR | Push / PR to `main` |

Both checks must pass before a PR can be merged.

## Reporting Security Issues

Do not open public issues for suspected security vulnerabilities.
Contact the repository owner directly and include:

- A clear description of the issue
- Reproduction steps or proof of concept
- Potential impact
- Suggested mitigation (if known)

See `SECURITY.md` for the full security reporting policy.
