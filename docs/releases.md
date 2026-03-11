# Introspection Release Process

This document covers semantic versioning, changelog format, the agent-assisted release system, and the process for promoting `develop` to `main`.

---

## Release Philosophy

Releases are **intentional events**, not automatic merges.

The `develop` branch is the **staging area for the next release**. When accumulated changes are ready, a release process promotes `develop` to `main`.

This ensures:

- Stable production history
- Clear release boundaries
- Organized changelogs
- Controlled versioning

---

## Develop → Main Promotion

`main` is updated only via Pull Request from `develop`. The release process:

1. Ensures `develop` is tested and ready
2. Prepares version bump and changelog
3. Opens a release PR: `develop` → `main`
4. After merge, `main` is tagged (e.g. `v1.2.0`)

The merge is **manually approved**; automation prepares the release, not the final merge.

---

## Versioning Strategy

Introspection uses **Semantic Versioning**: `MAJOR.MINOR.PATCH`

### Major

Breaking or structural changes (e.g. `v2.0.0`).

- Major architecture shift
- Incompatible UX redesign
- Breaking API change

### Minor

New features or capabilities (e.g. `v1.3.0`).

- New insight generator
- New UI views
- Expanded memory features

### Patch

Bug fixes and small improvements (e.g. `v1.3.2`).

- Bug fixes
- Small UX tweaks
- Performance improvements

---

## Changelog

All releases are documented in **CHANGELOG.md**.

**Typical format:**

```markdown
## v0.3.0

### Features
- Added daily reflection generator
- Added AI insight clustering

### Fixes
- Fixed clipboard issues on mobile

### Improvements
- Improved prompt generation speed
```

The release agent assists with drafting this file.

---

## Agent-Assisted Release System

Introspection is designed to support **AI-assisted release management**.

A release agent can analyze changes between `develop` and `main` to prepare the next version.

The agent:

1. Analyzes the git diff between `main`…`develop`
2. Summarizes changes
3. Categorizes updates (features, fixes, refactors)
4. Proposes a semantic version bump
5. Updates `CHANGELOG.md`
6. Updates the application version
7. Generates release notes
8. Prepares the release PR from `develop` → `main`

The agent **prepares the release**; the merge is still manually approved.
