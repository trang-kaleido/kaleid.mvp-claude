#!/bin/bash

# Kaleido School MVP - Initialization Script
# Run this to install dependencies and start the dev server

set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Starting development server..."
npm run dev
