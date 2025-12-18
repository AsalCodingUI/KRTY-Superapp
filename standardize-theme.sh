#!/bin/bash

# Theme Standardization - Batch Color Replacement Script
# This script replaces hardcoded Tailwind colors with semantic tokens

echo "Starting theme standardization..."

# Define the search path
SRC_PATH="src"

# Background colors
echo "Replacing background colors..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/bg-white\([^-]\)/bg-surface\1/g' \
  -e 's/bg-zinc-50\([^-]\)/bg-muted\1/g' \
  -e 's/bg-zinc-100\([^-]\)/bg-muted\1/g' \
  -e 's/bg-zinc-900\([^-]\)/bg-surface\1/g' \
  {} +

# Text colors  
echo "Replacing text colors..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/text-zinc-900\([^-]\)/text-content\1/g' \
  -e 's/text-zinc-800\([^-]\)/text-content\1/g' \
  -e 's/text-zinc-700\([^-]\)/text-content-subtle\1/g' \
  -e 's/text-zinc-600\([^-]\)/text-content-subtle\1/g' \
  -e 's/text-zinc-500\([^-]\)/text-content-subtle\1/g' \
  -e 's/text-zinc-400\([^-]\)/text-content-placeholder\1/g' \
  -e 's/text-zinc-50\([^-]\)/text-content\1/g' \
  {} +

# Border colors
echo "Replacing border colors..."
find "$SRC_PATH" -name "*.tsx" -type f -exec sed -i '' \
  -e 's/border-zinc-200\([^-]\)/border\1/g' \
  -e 's/border-zinc-300\([^-]\)/border-input\1/g' \
  -e 's/border-zinc-800\([^-]\)/border\1/g' \
  {} +

echo "✅ Batch replacement complete!"
echo "Files modified: $(find "$SRC_PATH" -name "*.tsx" -type f | wc -l)"
