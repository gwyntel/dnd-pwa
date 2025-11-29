#!/bin/bash
set -e

echo "🚀 D&D PWA Development Environment Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/main.js" ]; then
    echo "❌ Error: Not in D&D PWA project directory"
    echo "Please run this script from the project root"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js version 18+ required, found $(node -v)"
    echo "Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if Vite is available
if ! npx vite --version &> /dev/null; then
    echo "❌ Error: Vite is not available"
    echo "Try: rm -rf node_modules package-lock.json && npm install"
    exit 1
fi

echo "✅ Vite $(npx vite --version) ready"

# Start development server in background
echo "🌐 Starting Vite development server..."
npm run dev > vite.log 2>&1 &
VITE_PID=$!

# Wait for server to start (up to 30 seconds)
echo "⏳ Waiting for server to start..."
SERVER_READY=false
for i in {1..30}; do
    if curl -f http://localhost:5173 > /dev/null 2>&1; then
        SERVER_READY=true
        break
    fi
    sleep 1
    echo -n "."
done
echo ""

if [ "$SERVER_READY" = true ]; then
    echo "✅ Development server started successfully!"
    echo "🌐 App available at: http://localhost:5173"
    echo ""
    echo "📝 Useful commands:"
    echo "  • View server logs: tail -f vite.log"
    echo "  • Stop server: kill $VITE_PID"
    echo "  • Run tests: npm test"
    echo "  • Build for production: npm run build"
    echo ""
    echo "🎮 Ready to develop D&D PWA!"
    echo "💡 Next: Run 'Work on next feature' to start coding"
else
    echo "❌ Server failed to start within 30 seconds"
    echo "📋 Check vite.log for error details:"
    cat vite.log
    echo ""
    echo "🔧 Troubleshooting:"
    echo "  • Check if port 5173 is available"
    echo "  • Verify all dependencies installed: npm install"
    echo "  • Check Node.js version: node --version"
    echo ""
    exit 1
fi

# Keep script running to show server is active
echo "🖥️  Server is running in background (PID: $VITE_PID)"
echo "Press Ctrl+C to stop the server and exit"
trap "echo '🛑 Stopping server...'; kill $VITE_PID 2>/dev/null; exit 0" INT
wait
