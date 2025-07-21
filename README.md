# Next.js Discord Bot Dashboard

A modern, responsive dashboard for managing your Discord music bot built with Next.js, TailwindCSS, and Firebase.

## Features

- 🎵 **Music Bot Management** - Monitor and control your Discord music bot
- 📊 **Real-time Analytics** - Track usage statistics and performance metrics
- 🔐 **Discord OAuth** - Secure authentication with Discord
- 🎨 **Modern UI** - Beautiful glass morphism design with dark theme
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔥 **Firebase Integration** - Real-time database for statistics and user data
- 👑 **Admin Panel** - Advanced management tools for administrators
- 📈 **Interactive Charts** - Visual data representation with Chart.js

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, Heroicons
- **Authentication**: NextAuth.js with Discord OAuth
- **Database**: Firebase Firestore
- **Charts**: Chart.js with React wrapper
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Discord Application with OAuth2 setup
- Firebase project with Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd website-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure your `.env.local` file:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com

# Admin Users (Discord IDs)
ADMIN_USER_IDS=123456789012345678,987654321098765432
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Navigate to OAuth2 section
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret to your `.env.local`

## Firebase Setup

1. Create a new Firebase project
2. Enable Firestore database
3. Create a service account:
   - Go to Project Settings → Service accounts
   - Generate new private key
   - Download the JSON file
4. Extract the required values for your `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed on any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS
- DigitalOcean

## API Endpoints

- `GET /api/stats` - Get dashboard statistics
- `GET /api/charts` - Get chart data
- `GET /api/guilds/user` - Get user's guilds
- `GET /api/admin/stats` - Get admin statistics (admin only)
- `POST /api/admin/refresh` - Refresh statistics (admin only)

## Project Structure

```
website-nextjs/
├── components/          # React components
│   ├── Layout.tsx      # Main layout component
│   └── Charts.tsx      # Chart components
├── lib/                # Utility libraries
│   ├── firebase.ts     # Firebase service
│   └── auth.ts         # Auth configuration
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── index.tsx       # Homepage
│   ├── dashboard.tsx   # User dashboard
│   └── _app.tsx        # App wrapper
├── styles/             # CSS styles
│   └── globals.css     # Global styles
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on GitHub or contact the maintainers.

---

Made with ❤️ for the Discord community
