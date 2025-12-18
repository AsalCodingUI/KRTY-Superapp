#!/bin/bash

# Theme Standardization - Second Pass (Dark Mode Variants)
# This script handles dark mode specific color replacements

echo "Starting dark mode color standardization (Pass 2)..."

SRC_PATH="src"

# Dark mode surface/background (zinc-950 -> surface)
echo "Replacing dark mode surfaces..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/dark:bg-zinc-950/dark:bg-surface/g' \
  {} +

# Dark mode hover states (zinc-800 -> hover)
echo "Replacing dark mode hover states..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/dark:bg-zinc-800/dark:bg-hover/g' \
  -e 's/dark:hover:bg-zinc-800/dark:hover:bg-hover/g' \
  {} +

# Dark mode subtle states (zinc-700)
echo "Replacing dark mode subtle states..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/dark:bg-zinc-700/dark:bg-muted/g' \
  -e 's/dark:hover:bg-zinc-700/dark:hover:bg-hover/g' \
  {} +

# Dark mode borders (zinc-700/800 -> border)
echo "Replacing dark mode borders..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/dark:border-zinc-700/dark:border-border-subtle/g' \
  -e 's/dark:border-zinc-800/dark:border/g' \
  {} +

# Dark mode text (zinc-200/300 -> content variants)
echo "Replacing dark mode text..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/dark:text-zinc-200/dark:text-content/g' \
  -e 's/dark:text-zinc-300/dark:text-content-subtle/g' \
  {} +

# Remaining edge cases for dividers
echo "Replacing divider colors..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-zinc-200 /bg-border /g' \
  -e 's/bg-zinc-300/bg-border-input/g' \
  -e 's/bg-zinc-400/bg-border-strong/g' \
  {} +

echo "✅ Dark mode batch replacement complete!"
