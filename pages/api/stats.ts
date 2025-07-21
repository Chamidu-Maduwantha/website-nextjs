import type { NextApiRequest, NextApiResponse } from 'next';
import { BotFirebaseService } from '../../utils/firebase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const stats = await BotFirebaseService.getBotStats();
    
    // Map the field names to match the dashboard interface
    const mappedStats = {
      totalServers: stats?.totalActiveGuilds || 0, // Only count active servers
      totalUsers: stats?.totalUsers || 0,
      totalCommands: stats?.commandsUsed || 0,
      totalSongs: stats?.totalSongs || 0,
      uptime: stats?.uptime || 0,
      status: stats?.status || 'unknown',
      lastUpdated: stats?.lastUpdated || null
    };
    
    res.status(200).json(mappedStats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
