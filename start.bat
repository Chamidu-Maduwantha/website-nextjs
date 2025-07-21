@echo off
echo 🚀 Starting Discord Bot Dashboard...
echo 📍 Location: http://localhost:3000
echo 🔧 Environment: Development
echo.

rem Check if .env.local exists
if not exist .env.local (
    echo ⚠️  Warning: .env.local file not found!
    echo 💡 Please copy .env.local.example to .env.local and configure your environment variables.
    echo.
)

rem Start the development server
npm run dev
