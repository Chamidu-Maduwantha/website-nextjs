import NextAuth, { AuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

export const authOptions: AuthOptions = {
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
        console.log('Session callback - User ID:', token.sub);
        console.log('Session callback - Is admin:', session.user.isAdmin);
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
};

export default NextAuth(authOptions);

async function isAdmin(userId: string): Promise<boolean> {
  const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  console.log('Checking admin status for user:', userId);
  console.log('Admin user IDs:', adminUserIds);
  const result = adminUserIds.includes(userId);
  console.log('Is admin result:', result);
  return result;
}

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
