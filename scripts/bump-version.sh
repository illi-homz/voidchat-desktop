#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 {major|minor|patch}" >&2
  exit 1
fi

PART="$1"
if [[ "$PART" != "major" && "$PART" != "minor" && "$PART" != "patch" ]]; then
  echo "Error: argument must be 'major', 'minor' or 'patch', got '$PART'" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: not inside a git repository" >&2
  exit 1
fi

if ! git diff --quiet; then
  echo "Error: working directory is not clean. Commit or stash changes first." >&2
  exit 1
fi

CURRENT="$(node -e "console.log(require('./package.json').version)")"
IFS='.' read -r MAJ MIN PATCH <<< "$CURRENT"

case "$PART" in
  major)
    MAJ=$((MAJ + 1))
    MIN=0
    PATCH=0
    ;;
  minor)
    MIN=$((MIN + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="${MAJ}.${MIN}.${PATCH}"

# Update package.json version
node -e "
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Update src-tauri/tauri.conf.json version
node -e "
const conf = require('./src-tauri/tauri.conf.json');
conf.version = '$NEW_VERSION';
require('fs').writeFileSync('./src-tauri/tauri.conf.json', JSON.stringify(conf, null, 2) + '\n');
"

git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "release v$NEW_VERSION"

echo ""
echo "⬆️  Pushing to remote..."
if git push --follow-tags 2>&1; then
	echo ""
	echo "✅ Version $NEW_VERSION released!"
	echo "   Actions: раздел Actions на GitHub"
	echo "   Release: раздел Releases на GitHub"
else
	echo "⚠️  Tag created locally but push failed."
	echo "   Run manually: git push --follow-tags"
fi
