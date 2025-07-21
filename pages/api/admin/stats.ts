import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { FirebaseService } from '../../../lib/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, {});
    
    if (!session?.user?.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const stats = await FirebaseService.getDashboardStats();
    
    // Get sensitive data for admin users
    const guilds = await FirebaseService.getAllGuilds();
    const commandUsage = await FirebaseService.getCommandUsageStats(30);
    const musicUsage = await FirebaseService.getMusicUsageStats(30);
    const errors = await FirebaseService.getRecentErrors(50);
    
    // Process user data
    const userStats = new Map();
    commandUsage.forEach(cmd => {
      if (!userStats.has(cmd.userId)) {
        userStats.set(cmd.userId, {
          id: cmd.userId,
          username: cmd.username,
          commandsUsed: 0,
          songsPlayed: 0,
          lastSeen: cmd.timestamp,
        });
      }
      userStats.get(cmd.userId).commandsUsed++;
    });
    
    musicUsage.forEach(music => {
      if (!userStats.has(music.userId)) {
        userStats.set(music.userId, {
          id: music.userId,
          username: music.username,
          commandsUsed: 0,
          songsPlayed: 0,
          lastSeen: music.timestamp,
        });
      }
      if (music.action === 'play') {
        userStats.get(music.userId).songsPlayed++;
      }
    });
    
    const adminStats = {
      ...stats,
      totalCommands: commandUsage.length,
      totalSongs: musicUsage.filter(m => m.action === 'play').length,
      recentErrors: errors.length,
      performance: {
        avgResponseTime: 85,
        errorRate: (errors.length / commandUsage.length) * 100,
      },
      sensitiveData: {
        guilds: guilds.map((guild: any) => ({
          id: guild.id,
          name: guild.name || 'Unknown',
          ownerId: guild.ownerId || 'Unknown',
          ownerName: guild.ownerName || 'Unknown',
          memberCount: guild.memberCount || 0,
          commandsUsed: guild.commandsUsed || 0,
          songsPlayed: guild.songsPlayed || 0,
          lastActive: guild.lastActive?.toDate?.()?.toISOString() || new Date().toISOString(),
        })),
        users: Array.from(userStats.values()).slice(0, 50),
        errors: errors.map((error: any) => ({
          error: error.error,
          timestamp: error.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          userId: error.userId,
          guildId: error.guildId,
          severity: error.severity,
        })),
      },
    };
    
    res.status(200).json(adminStats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
