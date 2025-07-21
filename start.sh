#!/bin/bash

# Discord Bot Dashboard - Next.js Development Server
echo "🚀 Starting Discord Bot Dashboard..."
echo "📍 Location: http://localhost:3000"
echo "🔧 Environment: Development"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local file not found!"
    echo "💡 Please copy .env.local.example to .env.local and configure your environment variables."
    echo ""
fi

# Start the development server
npm run dev
