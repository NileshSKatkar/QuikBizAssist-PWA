#!/usr/bin/env bash
# Helper: create a new git repo from QuikBizAssist-PWA folder
set -e
SRC=QuikBizAssist-PWA
DEST=../QuikBizAssist-PWA-repo
echo "Creating standalone repo at $DEST"
mkdir -p "$DEST"
cd "$SRC"
git init
git add -A
git commit -m "Initial import of QuikBizAssist-PWA"
echo "Standalone repo created in $(pwd)"
