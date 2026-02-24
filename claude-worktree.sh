#!/bin/bash
# Launch Claude Code in an isolated git worktree
# Usage: ./claude-worktree.sh [optional-branch-name]

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BRANCH_NAME="${1:-claude-$(date +%s)}"
WORKTREE_DIR="$REPO_DIR/.claude/worktrees/$BRANCH_NAME"

# Create the worktree
mkdir -p "$REPO_DIR/.claude/worktrees"
git -C "$REPO_DIR" worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Worktree already exists or branch name taken. Reusing existing worktree."
  WORKTREE_DIR="$REPO_DIR/.claude/worktrees/$BRANCH_NAME"
fi

echo "Launching Claude Code in worktree: $WORKTREE_DIR"
echo "Branch: $BRANCH_NAME"
echo "When done, merge your branch and run: git worktree remove $WORKTREE_DIR"

cd "$WORKTREE_DIR" && claude
