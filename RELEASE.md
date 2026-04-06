# Release Process

This repository publishes Docker releases from semantic version tags.

## Prerequisites

- CI workflow passing on `main`
- Version ready for release
- Release notes scope agreed

## Steps

1. Ensure local `main` is up to date.
1. Create and push a semantic version tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

1. Wait for `.github/workflows/cd.yml` to finish:
   - Runs tests and build
   - Builds and pushes multi-arch image to GHCR
   - Creates GitHub Release notes

## Verify

- Confirm GitHub Release exists for `vX.Y.Z`
- Confirm GHCR image tags were published
- Smoke test container startup:

```bash
docker run -p 3100:3100 -e QUESTRADE_REFRESH_TOKEN=<token> ghcr.io/<owner>/<repo>:vX.Y.Z
```
