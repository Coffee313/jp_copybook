#!/usr/bin/env bash
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ $(git branch --show-current) != main ]]; then
  printf '%s\n' 'Refusing to publish: switch to the main branch first.' >&2
  exit 1
fi

git fetch origin main
if ! git merge-base --is-ancestor origin/main HEAD; then
  printf '%s\n' 'Refusing to publish: local main is behind or diverged from origin/main.' >&2
  printf '%s\n' 'Integrate the remote changes first, then run this script again.' >&2
  exit 1
fi

git add -A
if git diff --cached --quiet; then
  printf '%s\n' 'No new changes to commit.'
else
  git commit -m "${*:-publish updates}"
fi

git push -u origin main
