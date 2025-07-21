import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
};

// Initialize Firebase Admin
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const db = getFirestore(app);

export { db };

// Firebase service functions
export class FirebaseService {
  // Get bot statistics
  static async getBotStats() {
    try {
      const statsRef = db.collection('botStats').doc('global');
      const doc = await statsRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting bot stats:', error);
      return null;
    }
  }

  // Get all guilds
  static async getAllGuilds() {
    try {
      const guildsRef = db.collection('guilds');
      const snapshot = await guildsRef.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting guilds:', error);
      return [];
    }
  }

  // Get user's guilds
  static async getUserGuilds(userId: string) {
    try {
      const guildsRef = db.collection('guilds');
      const snapshot = await guildsRef.where('members', 'array-contains', userId).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting user guilds:', error);
      return [];
    }
  }

  // Get guild stats
  static async getGuildStats(guildId: string) {
    try {
      const guildRef = db.collection('guilds').doc(guildId);
      const doc = await guildRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting guild stats:', error);
      return null;
    }
  }

  // Get command usage stats
  static async getCommandUsageStats(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const commandsRef = db.collection('commandUsage');
      const snapshot = await commandsRef
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting command usage stats:', error);
      return [];
    }
  }

  // Get music usage stats
  static async getMusicUsageStats(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const musicRef = db.collection('musicUsage');
      const snapshot = await musicRef
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting music usage stats:', error);
      return [];
    }
  }

  // Get recent errors
  static async getRecentErrors(limit: number = 50) {
    try {
      const errorsRef = db.collection('errors');
      const snapshot = await errorsRef
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting recent errors:', error);
      return [];
    }
  }

  // Get user info
  static async getUserInfo(userId: string) {
    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  // Update user info
  static async updateUserInfo(userId: string, userData: any) {
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.set(userData, { merge: true });
      return true;
    } catch (error) {
      console.error('Error updating user info:', error);
      return false;
    }
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    try {
      const [botStats, guilds, users, commands, music] = await Promise.all([
        this.getBotStats(),
        this.getAllGuilds(),
        db.collection('users').get(),
        this.getCommandUsageStats(1),
        this.getMusicUsageStats(1),
      ]);

      return {
        totalServers: guilds.length,
        totalUsers: users.size,
        totalCommands: commands.length,
        totalSongs: music.length,
        botStats,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalServers: 0,
        totalUsers: 0,
        totalCommands: 0,
        totalSongs: 0,
        botStats: null,
      };
    }
  }

  // Get chart data
  static async getChartData(days: number = 7) {
    try {
      const commands = await this.getCommandUsageStats(days);
      const music = await this.getMusicUsageStats(days);

      // Process data for charts
      const commandsByDate = this.groupByDate(commands, days);
      const musicByDate = this.groupByDate(music, days);
      const topCommands = this.getTopCommands(commands);

      return {
        commandUsage: {
          labels: Object.keys(commandsByDate),
          data: Object.values(commandsByDate),
        },
        musicUsage: {
          labels: Object.keys(musicByDate),
          data: Object.values(musicByDate),
        },
        topCommands: {
          labels: topCommands.map(c => c.command),
          data: topCommands.map(c => c.count),
        },
      };
    } catch (error) {
      console.error('Error getting chart data:', error);
      return {
        commandUsage: { labels: [], data: [] },
        musicUsage: { labels: [], data: [] },
        topCommands: { labels: [], data: [] },
      };
    }
  }

  // Helper functions
  private static groupByDate(data: any[], days: number) {
    const result: { [key: string]: number } = {};
    
    // Initialize all dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result[dateStr] = 0;
    }

    // Count items by date
    data.forEach(item => {
      const dateStr = item.timestamp.toDate().toISOString().split('T')[0];
      if (result[dateStr] !== undefined) {
        result[dateStr]++;
      }
    });

    return result;
  }

  private static getTopCommands(commands: any[]) {
    const commandCounts: { [key: string]: number } = {};
    
    commands.forEach(cmd => {
      commandCounts[cmd.command] = (commandCounts[cmd.command] || 0) + 1;
    });

    return Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }
}
