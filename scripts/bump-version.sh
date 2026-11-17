#!/usr/bin/env bash
# Bumps the app version everywhere it must stay in sync and commits it.
# CI (.github/workflows/build-desktop.yml) tags and releases every push to
# main automatically, auto-incrementing the patch version unless it sees the
# pushed commit already carries a version ahead of the latest tag — which is
# exactly what this script produces. So this script is only needed for a
# deliberate minor/major bump; an ordinary patch release needs no script at
# all, just `git push`. It never pushes or tags itself — CI owns the tag, so
# that the two can't disagree about what the next version is.
#
# Usage: scripts/bump-version.sh <new-version>
#   e.g. scripts/bump-version.sh 0.2.0
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: scripts/bump-version.sh <new-version>" >&2
  exit 1
fi

VERSION="$1"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: version must be plain semver (e.g. 0.2.0), no leading 'v'." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: release must be tagged from 'main' (currently on '$CURRENT_BRANCH')." >&2
  exit 1
fi

TAG="v$VERSION"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Error: tag $TAG already exists." >&2
  exit 1
fi

LATEST_TAG="$(git tag --list 'v*' --sort=-v:refname | head -n1 | sed 's/^v//')"
LATEST_TAG="${LATEST_TAG:-0.0.0}"
if [[ "$VERSION" == "$LATEST_TAG" ]]; then
  echo "Error: $VERSION matches the latest existing tag; pick a version ahead of it." >&2
  exit 1
fi

echo "Bumping to $VERSION..."

# package.json and tauri.conf.json are both plain JSON with a top-level
# "version" key, so a tiny Node script keeps formatting (2-space indent,
# trailing newline) rather than reaching for a different tool per file.
bump_json() {
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const version = process.argv[2];
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    data.version = version;
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  ' "$1" "$VERSION"
}

bump_json "package.json"
bump_json "src-tauri/tauri.conf.json"

# Cargo.toml: only the version line directly under [package], not any
# dependency that happens to also declare `version = "..."`.
perl -0pi -e 's/(\[package\](?:(?!\n\[).)*?\nversion = ")[^"]+(")/${1}'"$VERSION"'${2}/s' src-tauri/Cargo.toml

# Keeps Cargo.lock's own record of this crate's version in sync so a
# `--locked` build never trips over a stale lockfile.
(cd src-tauri && cargo check --quiet)

git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "chore: bump version to $VERSION"

echo ""
echo "Done. Review the commit, then push to release it as $TAG:"
echo ""
echo "  git push origin main"
