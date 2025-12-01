#!/bin/bash

set -e

echo "🎲 D&D PWA - Development Environment Setup"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm (comes with Node.js)"
    exit 1
fi

if ! command_exists git; then
    echo "⚠️  Git is not installed. Some features may not work properly."
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "⚠️  Node.js version $NODE_VERSION detected. Version 18+ is recommended."
else
    echo "✅ Node.js version $NODE_VERSION detected"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found"
    echo "💡 Copying from .env.example..."
    cp .env.example .env.local
    
    # Check if .env.example exists
    if [ ! -f ".env.example" ]; then
        echo "❌ Neither .env.local nor .env.example exist"
        echo "📝 Creating default .env.local..."
        cat > .env.local << EOF
# OpenRouter API Key (optional - can also use OAuth)
# Get yours from https://openrouter.ai/keys
VITE_OPENROUTER_API_KEY=sk-or-your-key-here

# Default AI Model (optional)
# VITE_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# Development settings
# VITE_DEBUG_MODE=true
EOF
    fi
    
    echo "⚠️  Please edit .env.local with your OpenRouter API key if needed"
fi

# Run migrations
echo "🔄 Running data migrations..."
node -e "
import('./src/utils/migrations/backfill-monsters.js').then(m => {
  console.log('Backfill monsters migration completed');
}).catch(e => console.log('Migration skipped or failed:', e.message));
"

node -e "
import('./src/utils/migrations/convert-inventory-v2.js').then(m => {
  console.log('Inventory v2 migration completed');
}).catch(e => console.log('Migration skipped or failed:', e.message));
"

# Start development server
echo "🚀 Starting development server..."
npm run dev &

# Get the process ID
DEV_SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development server..."
    kill $DEV_SERVER_PID 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Health check
echo "🔍 Running health check..."
if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Server is running at http://localhost:5173"
    echo ""
    echo "🎉 D&D PWA is ready!"
    echo ""
    echo "📱 Open your browser to http://localhost:5173"
    echo "🔐 Set up authentication (OAuth or API key)"
    echo "⚔️  Create a character and start your adventure!"
    echo ""
    echo "💡 Press Ctrl+C to stop the server"
    
    # Keep script running
    wait $DEV_SERVER_PID
else
    echo "❌ Server failed to start properly"
    echo "📋 Check the output above for errors"
    kill $DEV_SERVER_PID 2>/dev/null
    exit 1
fi
