#!/usr/bin/env bash
# Bumps the app version everywhere it must stay in sync, then commits and
# tags the release. Pushing is a separate, explicit step (see the printed
# instructions at the end) — this script never pushes on its own.
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
git tag -a "$TAG" -m "Halabi Online Admin $TAG"

echo ""
echo "Done. Review the commit, then push both to trigger the signed release build:"
echo ""
echo "  git push origin main"
echo "  git push origin $TAG"
