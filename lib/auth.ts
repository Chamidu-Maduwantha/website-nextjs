import NextAuth from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { FirebaseService } from './firebase';

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify guilds',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user ID and admin status to session
      if (token.sub) {
        session.user.id = token.sub;
        session.user.isAdmin = await isAdmin(token.sub);
        
        // Update user info in Firebase
        await FirebaseService.updateUserInfo(token.sub, {
          id: token.sub,
          username: session.user.name,
          avatar: session.user.image,
          email: session.user.email,
          lastLogin: new Date(),
        });
      }
      
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
});

async function isAdmin(userId: string): Promise<boolean> {
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminUserIds.includes(userId);
}

// Types for NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      isAdmin: boolean;
    };
  }
}
